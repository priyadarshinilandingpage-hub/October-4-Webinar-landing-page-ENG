import { sha256Hex } from "../crypto";
import { readEnv, type ServerEnv } from "../env";
import { fulfilPaidOrder } from "../fulfil";
import { empty, json, readBodyLimited, type Ctx } from "../http";
import { sendPurchaseEvent } from "../meta-capi";
import { toPaidOrder } from "../order";
import { getOrder, isPaidAtOfferPrice, ORDER_ID_RE, verifyWebhookSignature } from "../razorpay";

// POST /api/webhooks/razorpay: Razorpay's server-to-server notice (Dashboard → Webhooks, events order.paid and
// payment.captured). Signature checked on the RAW body; the order is then re-read from Razorpay, so status and
// amount come from the source of truth. A failed follow-up answers 503 and Razorpay retries.

const MAX_BODY_BYTES = 64 * 1024;
const seen = new Map<string, number>(); // deliveries this instance already handled

interface Webhook {
  event?: unknown;
  payload?: { order?: { entity?: { id?: unknown } }; payment?: { entity?: { order_id?: unknown } } };
}

export async function handleWebhook({ request, env: envRaw }: Ctx): Promise<Response> {
  let env: ServerEnv;
  try {
    env = readEnv(envRaw);
  } catch (err) {
    console.error("[webhook] config", (err as Error).message);
    return empty(503); // Razorpay retries later
  }
  if (!env.RAZORPAY_WEBHOOK_SECRET) console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not set");

  const raw = await readBodyLimited(request, MAX_BODY_BYTES);
  if (raw === null) return empty(413);
  if (!(await verifyWebhookSignature(env, raw, request.headers.get("x-razorpay-signature")))) return empty(401);

  let event: Webhook;
  try {
    event = JSON.parse(new TextDecoder().decode(raw)) as Webhook;
  } catch {
    return empty(400);
  }
  const key = await sha256Hex(new TextDecoder().decode(raw));
  if (seen.has(key)) return json({ ok: true });

  const type = typeof event.event === "string" ? event.event.slice(0, 60) : "unknown";
  const rawId = event.payload?.order?.entity?.id ?? event.payload?.payment?.entity?.order_id;
  const orderId = typeof rawId === "string" && ORDER_ID_RE.test(rawId) ? rawId : undefined;

  if ((type === "order.paid" || type === "payment.captured") && orderId) {
    let order;
    try {
      order = await getOrder(env, orderId);
    } catch (err) {
      console.error("[webhook] order lookup failed", orderId, (err as Error).message);
      return empty(503); // not marked as seen, so the retry is processed
    }
    if (!order || !isPaidAtOfferPrice(order)) {
      console.warn("[webhook]", type, "but order not paid at offer price", orderId, order?.status ?? "missing");
    } else {
      const paid = toPaidOrder(order);
      let ok = true;
      try {
        await fulfilPaidOrder(env, paid);
      } catch (err) {
        ok = false;
        console.error("[webhook] follow-up failed", orderId, (err as Error).message);
      }
      const capi = await sendPurchaseEvent(env, paid); // Meta drops repeats of the same event id
      console.info("[webhook] payment confirmed", orderId, `capi=${capi}`, `followup=${ok ? "ok" : "retry"}`);
      if (!ok) return empty(503);
    }
  } else {
    console.info("[webhook]", type, orderId ?? "-");
  }

  if (seen.size > 5_000) seen.clear();
  seen.set(key, Date.now());
  return json({ ok: true });
}
