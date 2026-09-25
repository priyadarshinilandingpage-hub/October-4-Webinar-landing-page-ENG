import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { getOrder, isPaidAtOfferPrice, ORDER_ID_RE, verifyWebhookSignature } from "@/lib/cashfree";
import { fulfilPaidOrder } from "@/lib/fulfil";
import { json, readBodyLimited } from "@/lib/http";
import { sendPurchaseEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;

// Payloads already handled by this instance. Cashfree delivers at-least-once, so handling must be
// idempotent; anything that slips past this (another instance) is still safe to repeat.
const seen = new Map<string, number>();

interface Webhook {
  type?: unknown;
  data?: { order?: { order_id?: unknown } };
}

const empty = (status: number) => new Response(null, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: NextRequest) {
  // Verify against the RAW bytes. Parsing first would change them and break the signature.
  const raw = await readBodyLimited(req, MAX_BODY_BYTES);
  if (raw === null) return empty(413);

  let valid = false;
  try {
    valid = verifyWebhookSignature(raw, req.headers.get("x-webhook-timestamp"), req.headers.get("x-webhook-signature"));
  } catch (err) {
    console.error("[webhook] config", (err as Error).message);
    return empty(503); // Cashfree retries later
  }
  if (!valid) return empty(401);

  let event: Webhook;
  try {
    event = JSON.parse(raw.toString("utf8")) as Webhook;
  } catch {
    return empty(400);
  }

  const key = createHash("sha256").update(raw).digest("hex");
  if (seen.has(key)) return json({ ok: true });

  const type = typeof event.type === "string" ? event.type.slice(0, 60) : "unknown";
  const rawId = event.data?.order?.order_id;
  // Only our own orders (the Cashfree account may be used for other things too).
  const orderId = typeof rawId === "string" && ORDER_ID_RE.test(rawId) ? rawId : undefined;

  if (type === "PAYMENT_SUCCESS_WEBHOOK" && orderId) {
    // The payload is signed, but the order itself is re-read from Cashfree: status, amount and
    // currency come from the source of truth, plus the tags Meta needs.
    let order;
    try {
      order = await getOrder(orderId);
    } catch (err) {
      console.error("[webhook] order lookup failed", orderId, (err as Error).message);
      return empty(503); // not marked as seen, so Cashfree's retry is processed
    }
    if (!order || !isPaidAtOfferPrice(order)) {
      console.warn("[webhook] success event but order not paid at offer price", orderId, order?.order_status ?? "missing");
    } else {
      // Already-paid list, registrations row and confirmation email. Done here too, so it all happens even
      // if the buyer never opens the thank-you page.
      let fulfilled = true;
      try {
        await fulfilPaidOrder(order);
      } catch (err) {
        fulfilled = false;
        console.error("[webhook] follow-up failed", orderId, (err as Error).message);
      }
      // Meta drops repeats of the same event_id, so a retry after a failed follow-up is harmless.
      const capi = await sendPurchaseEvent(order);
      // Only ids in logs: never names, emails or phone numbers.
      console.info("[webhook] payment confirmed", orderId, `capi=${capi}`, `followup=${fulfilled ? "ok" : "retry"}`);
      if (!fulfilled) return empty(503); // not marked as seen: Cashfree retries and every step is safe to repeat
    }
  } else {
    console.info("[webhook]", type, orderId ?? "-");
  }

  if (seen.size > 5_000) seen.clear();
  seen.set(key, Date.now());
  return json({ ok: true });
}
