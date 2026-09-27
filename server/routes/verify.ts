import { readEnv, type ServerEnv } from "../env";
import { fulfilPaidOrder } from "../fulfil";
import { clientIp, fail, json, type Ctx } from "../http";
import { toPaidOrder } from "../order";
import { allow } from "../ratelimit";
import { ORDER_ID_RE, verifyOrder } from "../razorpay";

// GET /api/verify?order_id=order_…: the thank-you page asks here whether the order is paid. The answer comes from
// Razorpay (never from the address bar). Only a verified PAID order gets the WhatsApp group link back.

export async function handleVerify({ request, env: envRaw }: Ctx): Promise<Response> {
  let env: ServerEnv;
  try {
    env = readEnv(envRaw);
  } catch (err) {
    console.error("[verify] config", (err as Error).message);
    return json({ status: "pending" }, 503);
  }

  const orderId = new URL(request.url).searchParams.get("order_id") ?? "";
  if (!ORDER_ID_RE.test(orderId)) return json({ status: "not_found" });
  if (!(await allow(env, "verify", clientIp(request)))) return fail(429, "Too many checks. Please wait a minute.");

  let result;
  try {
    result = await verifyOrder(env, orderId);
  } catch (err) {
    console.error("[verify] lookup failed", orderId, (err as Error).message);
    return json({ status: "pending" });
  }
  if (result.status !== "paid" || !result.order) return json({ status: result.status });

  const order = toPaidOrder(result.order);
  // Also done by the callback and the webhook; a failure here never hides the confirmation (Razorpay said PAID).
  let duplicate = false;
  try {
    duplicate = Boolean((await fulfilPaidOrder(env, order)).duplicateOf);
  } catch (err) {
    console.error("[verify] follow-up failed", orderId, (err as Error).message);
  }
  return json({
    status: "paid",
    firstName: order.customer.name?.trim().split(/\s+/)[0] || undefined,
    whatsapp: env.WEBINAR_WHATSAPP_URL,
    duplicate,
  });
}
