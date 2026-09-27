import { AMOUNT_PAISE, OFFER } from "../lib/offer";
import { hmacSha256Hex, safeEqualHex } from "./crypto";
import type { ServerEnv } from "./env";

// Minimal Razorpay client over fetch (no SDK). Docs: https://razorpay.com/docs/api/orders/
// Amount and currency are decided here from lib/offer.ts, never from the browser.

const API = "https://api.razorpay.com/v1";

/** Razorpay order ids: "order_" + 14 letters/digits. Anything else is never sent to Razorpay. */
export const ORDER_ID_RE = /^order_[A-Za-z0-9]{14}$/;
export const PAYMENT_ID_RE = /^pay_[A-Za-z0-9]{14}$/;

export class RazorpayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RazorpayError";
  }
}

async function call<T>(env: ServerEnv, path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init.method,
    headers: {
      authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    // Only Razorpay's short error code is kept: the body can echo customer data.
    let code = "unknown";
    try {
      const c = ((await res.json()) as { error?: { code?: unknown } }).error?.code;
      if (typeof c === "string") code = c.slice(0, 60);
    } catch {}
    throw new RazorpayError(`Razorpay ${init.method} ${path.split("/")[1]} failed: ${res.status} ${code}`, res.status);
  }
  return (await res.json()) as T;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  status: "created" | "attempted" | "paid";
  receipt?: string | null;
  notes?: Record<string, string> | unknown[] | null;
}

interface RazorpayPayment {
  id: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  email?: string | null;
  contact?: string | null;
}

/** Creates an order for the fixed webinar price. `notes` are stored on the order (visible in the dashboard). */
export async function createOrder(env: ServerEnv, receipt: string, notes: Record<string, string>): Promise<RazorpayOrder> {
  const body = { amount: AMOUNT_PAISE, currency: OFFER.currency, receipt, notes };
  try {
    return await call<RazorpayOrder>(env, "/orders", { method: "POST", body });
  } catch (err) {
    // One retry on network errors and 5xx (an unused extra order is harmless); never on 4xx.
    if (err instanceof RazorpayError && err.status < 500) throw err;
    return call<RazorpayOrder>(env, "/orders", { method: "POST", body });
  }
}

/** Fetches an order. Null if it doesn't exist (or the id isn't one of Razorpay's). */
export async function getOrder(env: ServerEnv, orderId: string): Promise<RazorpayOrder | null> {
  if (!ORDER_ID_RE.test(orderId)) return null;
  try {
    const order = await call<RazorpayOrder>(env, `/orders/${orderId}`, { method: "GET" });
    return order.id === orderId ? order : null;
  } catch (err) {
    if (err instanceof RazorpayError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

async function getPayments(env: ServerEnv, orderId: string): Promise<RazorpayPayment[]> {
  const list = await call<{ items?: RazorpayPayment[] }>(env, `/orders/${orderId}/payments`, { method: "GET" });
  return Array.isArray(list.items) ? list.items : [];
}

/** For the startup check: false if Razorpay rejects the key id + secret. Throws if Razorpay can't be reached. */
export async function keysWork(env: ServerEnv): Promise<boolean> {
  try {
    await call(env, "/orders?count=1", { method: "GET" });
    return true;
  } catch (err) {
    if (err instanceof RazorpayError && (err.status === 401 || err.status === 403)) return false;
    throw err;
  }
}

/** True only if Razorpay says PAID for exactly our price in INR. */
export function isPaidAtOfferPrice(order: RazorpayOrder): boolean {
  return order.status === "paid" && order.amount === AMOUNT_PAISE && order.amount_paid === AMOUNT_PAISE && order.currency === OFFER.currency;
}

/** Notes as a plain string map (Razorpay returns [] when an order has none). */
export function notesOf(order: RazorpayOrder): Record<string, string> {
  const n = order.notes;
  if (!n || Array.isArray(n)) return {};
  return Object.fromEntries(Object.entries(n).filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

/**
 * paid      = captured, for OUR price in INR
 * pending   = a payment is authorised or still in progress (UPI / bank confirming)
 * unpaid    = no payment, or only failed ones (cancelled, declined)
 * failed    = paid for any other amount or currency
 * not_found = no such order
 */
export type VerifiedStatus = "paid" | "pending" | "unpaid" | "failed" | "not_found";

export async function verifyOrder(env: ServerEnv, orderId: string): Promise<{ status: VerifiedStatus; order?: RazorpayOrder }> {
  const order = await getOrder(env, orderId);
  if (!order) return { status: "not_found" };
  if (order.status === "paid") return isPaidAtOfferPrice(order) ? { status: "paid", order } : { status: "failed" };
  if (order.status === "created") return { status: "unpaid", order };
  try {
    const payments = await getPayments(env, orderId);
    const inFlight = payments.some((p) => p.status === "authorized" || p.status === "created" || p.status === "captured");
    return { status: inFlight ? "pending" : "unpaid", order };
  } catch {
    return { status: "pending", order }; // can't tell: be conservative
  }
}

/** Checkout signature: hex(HMAC-SHA256(order_id + "|" + payment_id, key_secret)). */
export async function verifyPaymentSignature(env: ServerEnv, orderId: string, paymentId: string, signature: string): Promise<boolean> {
  if (!ORDER_ID_RE.test(orderId) || !PAYMENT_ID_RE.test(paymentId) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  return safeEqualHex(await hmacSha256Hex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature);
}

/** Webhook signature: hex(HMAC-SHA256(raw body, webhook secret)), in X-Razorpay-Signature. RAW bytes only. */
export async function verifyWebhookSignature(env: ServerEnv, rawBody: Uint8Array, signature: string | null): Promise<boolean> {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature || !/^[0-9a-f]{64}$/.test(signature.trim())) return false;
  return safeEqualHex(await hmacSha256Hex(env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature.trim());
}
