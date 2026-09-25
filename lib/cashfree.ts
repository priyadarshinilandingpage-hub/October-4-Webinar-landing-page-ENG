import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { OFFER, ORDER_AMOUNT } from "./offer";

// Minimal Cashfree Payment Gateway client over fetch (no SDK dependency).
// Docs: https://www.cashfree.com/docs/api-reference/payments/latest/orders/create
//       https://www.cashfree.com/docs/payments/online/webhooks/signature-verification

const BASE = {
  sandbox: "https://sandbox.cashfree.com/pg",
  production: "https://api.cashfree.com/pg",
} as const;

/** Our order ids: "wb_" + 32 hex chars (a UUID without dashes). Anything else is never sent to Cashfree. */
export const ORDER_ID_RE = /^wb_[0-9a-f]{32}$/;

export function newOrderId(): { orderId: string; idempotencyKey: string } {
  const idempotencyKey = randomUUID(); // Cashfree expects a UUID here
  return { orderId: `wb_${idempotencyKey.replace(/-/g, "")}`, idempotencyKey };
}

export class CashfreeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CashfreeError";
  }
}

async function call<T>(path: string, init: { method: "GET" | "POST"; body?: string; idempotencyKey?: string }): Promise<T> {
  const e = env();
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-api-version": e.CASHFREE_API_VERSION,
    "x-client-id": e.CASHFREE_CLIENT_ID,
    "x-client-secret": e.CASHFREE_CLIENT_SECRET,
  };
  if (init.body) headers["content-type"] = "application/json";
  if (init.idempotencyKey) headers["x-idempotency-key"] = init.idempotencyKey;

  const res = await fetch(`${BASE[e.CASHFREE_ENV]}${path}`, {
    method: init.method,
    body: init.body,
    headers,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    // Keep only Cashfree's short error code for server logs. The body can echo customer data,
    // so it is never logged in full and never forwarded to the browser.
    let code = "unknown";
    try {
      const c = ((await res.json()) as { code?: unknown }).code;
      if (typeof c === "string") code = c.slice(0, 60);
    } catch {}
    throw new CashfreeError(`Cashfree ${init.method} ${path.split("/")[1]} failed: ${res.status} ${code}`, res.status);
  }
  return (await res.json()) as T;
}

/** Retry once (same idempotency key) on timeouts, network errors and 5xx. Never on 4xx. */
async function callWithRetry<T>(path: string, init: Parameters<typeof call>[1]): Promise<T> {
  try {
    return await call<T>(path, init);
  } catch (err) {
    const retryable = !(err instanceof CashfreeError) || err.status >= 500;
    if (!retryable) throw err;
    return call<T>(path, init);
  }
}

/** "2026-10-04T11:30:00+05:30": the ISO 8601 form Cashfree's docs use. */
export function toIstIso(d: Date): string {
  return new Date(d.getTime() + 330 * 60_000).toISOString().replace(/\.\d{3}Z$/, "+05:30");
}

export interface Customer {
  name: string;
  email: string;
  phone: string; // 10-digit Indian mobile
}

export interface CreateOrderResponse {
  order_id: string;
  payment_session_id: string;
  order_status: string;
}

/**
 * Creates an order for the fixed webinar price. Amount, currency and redirect URLs are decided here,
 * from lib/offer.ts and SITE_URL, never from the request.
 */
export async function createOrder(
  ids: { orderId: string; idempotencyKey: string },
  customer: Customer,
  tags: Record<string, string>,
  expiresAt: Date,
): Promise<CreateOrderResponse> {
  const e = env();
  const https = e.SITE_URL.startsWith("https://");
  return callWithRetry<CreateOrderResponse>("/orders", {
    method: "POST",
    idempotencyKey: ids.idempotencyKey,
    body: JSON.stringify({
      order_id: ids.orderId,
      order_amount: Number(ORDER_AMOUNT),
      order_currency: OFFER.currency,
      order_expiry_time: toIstIso(expiresAt),
      customer_details: {
        customer_id: ids.orderId.replace(/[^A-Za-z0-9]/g, ""), // alphanumeric only, per Cashfree
        // Cashfree needs 3+ characters; the name is optional, so very short names are left out.
        ...(customer.name.length >= 3 ? { customer_name: customer.name.slice(0, 100) } : {}),
        customer_email: customer.email,
        customer_phone: customer.phone,
      },
      order_meta: {
        return_url: `${e.SITE_URL}/thank-you?order_id=${ids.orderId}`,
        // Cashfree only accepts an https notify_url, so it is skipped on http://localhost.
        ...(https ? { notify_url: `${e.SITE_URL}/api/webhooks/cashfree` } : {}),
      },
      order_note: "Webinar registration",
      order_tags: tags,
    }),
  });
}

export type OrderStatus = "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";

export interface CashfreeOrder {
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: OrderStatus;
  order_tags?: Record<string, string> | null;
  customer_details?: {
    customer_name?: string | null;
    customer_email?: string | null;
    customer_phone?: string | null;
  } | null;
}

/** Fetches an order from Cashfree. Returns null if it doesn't exist (or isn't one of ours). */
export async function getOrder(orderId: string): Promise<CashfreeOrder | null> {
  if (!ORDER_ID_RE.test(orderId)) return null;
  try {
    const order = await call<CashfreeOrder>(`/orders/${orderId}`, { method: "GET" });
    return order.order_id === orderId ? order : null;
  } catch (err) {
    if (err instanceof CashfreeError && err.status === 404) return null;
    throw err;
  }
}

/** True only if Cashfree says PAID for exactly our price in INR. */
export function isPaidAtOfferPrice(order: CashfreeOrder): boolean {
  return (
    order.order_status === "PAID" &&
    Number(order.order_amount).toFixed(2) === ORDER_AMOUNT &&
    order.order_currency === OFFER.currency
  );
}

interface PaymentEntity {
  payment_status?: string;
}

/**
 * paid      = Cashfree confirms payment of OUR price in INR
 * pending   = a payment is in progress (UPI/bank still confirming)
 * unpaid    = order is open but nothing was paid (cancelled, failed or never attempted)
 * failed    = expired/terminated, or PAID for any other amount/currency
 * not_found = no such order
 */
export type VerifiedStatus = "paid" | "pending" | "unpaid" | "failed" | "not_found";

/**
 * Asks Cashfree (never the browser) whether an order is paid, and checks it is OUR price in INR.
 * `order` (paid only) is for server-side follow-up (lib/fulfil.ts); it is never rendered or sent to the browser.
 */
export async function verifyOrder(
  orderId: string,
): Promise<{ status: VerifiedStatus; firstName?: string; order?: CashfreeOrder }> {
  const order = await getOrder(orderId);
  if (!order) return { status: "not_found" };
  const firstName = order.customer_details?.customer_name?.trim().split(/\s+/)[0] || undefined;

  if (order.order_status === "PAID") {
    return isPaidAtOfferPrice(order) ? { status: "paid", firstName, order } : { status: "failed" };
  }
  if (order.order_status !== "ACTIVE") return { status: "failed" };

  // ACTIVE: tell "still confirming" apart from "cancelled / never paid".
  try {
    const payments = await call<PaymentEntity[]>(`/orders/${orderId}/payments`, { method: "GET" });
    const inFlight = Array.isArray(payments) && payments.some((p) => p.payment_status === "SUCCESS" || p.payment_status === "PENDING");
    return { status: inFlight ? "pending" : "unpaid", firstName };
  } catch {
    return { status: "pending", firstName }; // can't tell: be conservative
  }
}

/** Accepted clock difference between Cashfree and us. Cashfree retries (2, 10, 30 min) may re-use the original timestamp. */
export const WEBHOOK_TOLERANCE_MS = 60 * 60 * 1000;

/**
 * Verifies a Cashfree webhook: base64(HMAC-SHA256(timestamp + rawBody, clientSecret)).
 * Must be given the RAW request body bytes, exactly as received. Uses a constant-time compare.
 */
export function verifyWebhookSignature(
  rawBody: string | Uint8Array,
  timestamp: string | null,
  signature: string | null,
  now = Date.now(),
): boolean {
  if (!timestamp || !signature || !/^\d{10,13}$/.test(timestamp)) return false;
  // Cashfree sends milliseconds; accept seconds too.
  const tsMs = timestamp.length <= 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (now - tsMs > WEBHOOK_TOLERANCE_MS || tsMs - now > 5 * 60 * 1000) return false;
  if (!/^[A-Za-z0-9+/]{43}=$/.test(signature.trim())) return false; // base64 of 32 bytes

  const expected = createHmac("sha256", env().CASHFREE_CLIENT_SECRET).update(timestamp).update(rawBody).digest();
  const given = Buffer.from(signature.trim(), "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
