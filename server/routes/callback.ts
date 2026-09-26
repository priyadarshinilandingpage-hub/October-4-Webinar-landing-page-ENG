import { readEnv, type ServerEnv } from "../env";
import { fulfilPaidOrder } from "../fulfil";
import { redirect, readBodyLimited, type Ctx } from "../http";
import { sendPurchaseEvent } from "../meta-capi";
import { toPaidOrder } from "../order";
import { isPaidAtOfferPrice, getOrder, ORDER_ID_RE, verifyPaymentSignature } from "../razorpay";

// POST (or GET) /api/razorpay/callback: where Razorpay's checkout sends the buyer after paying (redirect mode,
// reliable in Instagram/Facebook in-app browsers). A valid signature starts the follow-up straight away (so the
// email goes out even if the buyer closes the tab); then the buyer lands on the thank-you page, which checks
// the order with Razorpay again. Redirects are always built from SITE_URL, never from the request.

const MAX_BODY_BYTES = 8_192;

async function fields(request: Request): Promise<URLSearchParams> {
  if (request.method !== "POST") return new URL(request.url).searchParams;
  const raw = await readBodyLimited(request, MAX_BODY_BYTES);
  return new URLSearchParams(raw ? new TextDecoder().decode(raw) : "");
}

async function followUp(env: ServerEnv, orderId: string) {
  try {
    const order = await getOrder(env, orderId);
    if (!order || !isPaidAtOfferPrice(order)) return;
    const paid = toPaidOrder(order);
    await Promise.allSettled([fulfilPaidOrder(env, paid), sendPurchaseEvent(env, paid)]);
  } catch (err) {
    console.error("[callback] follow-up failed", orderId, (err as Error).message);
  }
}

export async function handleCallback(ctx: Ctx): Promise<Response> {
  const { request, env: envRaw } = ctx;
  let env: ServerEnv | undefined;
  try {
    env = readEnv(envRaw);
  } catch (err) {
    console.error("[callback] config", (err as Error).message);
  }
  const base = env?.SITE_URL ?? new URL(request.url).origin;
  const f = await fields(request);

  // Success: razorpay_order_id + razorpay_payment_id + razorpay_signature. Failure: error[...] fields, with
  // the ids inside error[metadata] (JSON).
  let orderId = f.get("razorpay_order_id") ?? "";
  if (!orderId) {
    try {
      orderId = String((JSON.parse(f.get("error[metadata]") ?? "{}") as { order_id?: unknown }).order_id ?? "");
    } catch {}
  }
  if (!ORDER_ID_RE.test(orderId)) return redirect(`${base}/#join`);

  const paymentId = f.get("razorpay_payment_id") ?? "";
  const signature = f.get("razorpay_signature") ?? "";
  if (env && paymentId && (await verifyPaymentSignature(env, orderId, paymentId, signature))) {
    ctx.waitUntil(followUp(env, orderId));
  }
  return redirect(`${base}/thank-you?order_id=${orderId}`);
}
