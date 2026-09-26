import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findPaidOrder, resetBuyersForTests } from "@/server/buyers";
import { readEnv } from "@/server/env";
import { resetFulfilForTests } from "@/server/fulfil";
import { resetRateLimitForTests } from "@/server/ratelimit";
import { handleCallback } from "@/server/routes/callback";
import { handleVerify } from "@/server/routes/verify";
import { handleWebhook } from "@/server/routes/webhook";
import { ctx, hmacHex, jsonResponse, KEY_SECRET, mockFetch, ORDER_ID, PAYMENT_ID, rzpOrder, SITE, testEnv, WEBHOOK_SECRET } from "./helpers";

const WA = "https://chat.whatsapp.com/TestInviteCode123";

/** Razorpay's API: the order, and its payments list. */
function razorpay(order: Record<string, unknown>, payments: unknown[] = []) {
  return mockFetch((url) => {
    if (url.endsWith(`/orders/${ORDER_ID}`)) return jsonResponse(order);
    if (url.endsWith(`/orders/${ORDER_ID}/payments`)) return jsonResponse({ entity: "collection", count: payments.length, items: payments });
    return jsonResponse({ error: { code: "NOT_FOUND" } }, 404);
  });
}

const verify = (id: string, env = testEnv({ WEBINAR_WHATSAPP_URL: WA })) =>
  handleVerify(ctx(new Request(`${SITE}/api/verify?order_id=${id}`, { headers: { "cf-connecting-ip": "192.0.2.1" } }), env));

beforeEach(() => {
  resetBuyersForTests();
  resetFulfilForTests();
  resetRateLimitForTests();
});
afterEach(() => vi.unstubAllGlobals());

describe("GET /api/verify (the thank-you page's check)", () => {
  it("PAID for 9900 paise INR → paid, the WhatsApp link, and the buyer goes on the already-paid list", async () => {
    razorpay(rzpOrder());
    const env = testEnv({ WEBINAR_WHATSAPP_URL: WA });
    const body = await (await verify(ORDER_ID, env)).json();
    expect(body).toMatchObject({ status: "paid", firstName: "Priya", whatsapp: WA, duplicate: false });
    expect(await findPaidOrder(readEnv(env), { email: "PRIYA@example.com" })).toBe(ORDER_ID);
  });

  it("the WhatsApp link is never returned for an unpaid order", async () => {
    razorpay(rzpOrder({ status: "created", amount_paid: 0 }));
    const body = await (await verify(ORDER_ID)).json();
    expect(body).toEqual({ status: "unpaid" });
  });

  it("paid a different amount or currency → failed", async () => {
    razorpay(rzpOrder({ amount: 100, amount_paid: 100 }));
    expect((await (await verify(ORDER_ID)).json()).status).toBe("failed");
    razorpay(rzpOrder({ currency: "USD" }));
    expect((await (await verify(ORDER_ID)).json()).status).toBe("failed");
  });

  it("attempted with an authorised payment → pending; with only failed payments → unpaid", async () => {
    razorpay(rzpOrder({ status: "attempted", amount_paid: 0 }), [{ id: PAYMENT_ID, status: "authorized" }]);
    expect((await (await verify(ORDER_ID)).json()).status).toBe("pending");
    razorpay(rzpOrder({ status: "attempted", amount_paid: 0 }), [{ id: PAYMENT_ID, status: "failed" }]);
    expect((await (await verify(ORDER_ID)).json()).status).toBe("unpaid");
  });

  it.each(["", "abc", "order_123", "../orders", `${ORDER_ID}/payments`])("bad order id %j → not_found without calling Razorpay", async (id) => {
    const f = razorpay(rzpOrder());
    expect((await (await verify(encodeURIComponent(id))).json()).status).toBe("not_found");
    expect(f).not.toHaveBeenCalled();
  });

  it("Razorpay down → pending (the page keeps checking), no crash", async () => {
    mockFetch(() => jsonResponse({}, 500));
    expect((await (await verify(ORDER_ID)).json()).status).toBe("pending");
  });
});

describe("/api/razorpay/callback (where Razorpay returns the buyer)", () => {
  const form = (fields: Record<string, string>) =>
    new Request(`${SITE}/api/razorpay/callback`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString(),
    });

  it("valid signature → 303 to the thank-you page, and the follow-up runs in the background", async () => {
    razorpay(rzpOrder());
    const env = testEnv();
    const c = ctx(form({ razorpay_order_id: ORDER_ID, razorpay_payment_id: PAYMENT_ID, razorpay_signature: hmacHex(KEY_SECRET, `${ORDER_ID}|${PAYMENT_ID}`) }), env);
    const res = await handleCallback(c);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${SITE}/thank-you?order_id=${ORDER_ID}`);
    await c.settle();
    expect(await findPaidOrder(readEnv(env), { phone: "9876543210" })).toBe(ORDER_ID);
  });

  it("forged signature → still sent to the thank-you page (which checks Razorpay), but no follow-up", async () => {
    const f = razorpay(rzpOrder());
    const c = ctx(form({ razorpay_order_id: ORDER_ID, razorpay_payment_id: PAYMENT_ID, razorpay_signature: "0".repeat(64) }));
    const res = await handleCallback(c);
    expect(res.headers.get("location")).toBe(`${SITE}/thank-you?order_id=${ORDER_ID}`);
    await c.settle();
    expect(f).not.toHaveBeenCalled();
  });

  it("payment failed → the order id is read from error[metadata]", async () => {
    const res = await handleCallback(ctx(form({ "error[code]": "BAD_REQUEST_ERROR", "error[metadata]": JSON.stringify({ order_id: ORDER_ID, payment_id: PAYMENT_ID }) })));
    expect(res.headers.get("location")).toBe(`${SITE}/thank-you?order_id=${ORDER_ID}`);
  });

  it("no usable order id → back to the form; redirects never use an address from the request", async () => {
    const res = await handleCallback(ctx(form({ razorpay_order_id: "https://evil.example" })));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${SITE}/#join`);
  });
});

describe("POST /api/webhooks/razorpay", () => {
  let n = 0;
  const event = (type = "order.paid", orderId = ORDER_ID) =>
    JSON.stringify({ event: type, payload: { order: { entity: { id: orderId } }, payment: { entity: { id: `${PAYMENT_ID}`, order_id: orderId, n: ++n } } } });
  const hook = (raw: string, signature?: string) =>
    new Request(`${SITE}/api/webhooks/razorpay`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(signature ? { "x-razorpay-signature": signature } : {}) },
      body: raw,
    });
  const signed = (raw: string) => hook(raw, hmacHex(WEBHOOK_SECRET, raw));

  it("unsigned or wrongly signed → 401, Razorpay's API is not called", async () => {
    const f = razorpay(rzpOrder());
    expect((await handleWebhook(ctx(hook(event())))).status).toBe(401);
    expect((await handleWebhook(ctx(hook(event(), hmacHex("wrong_secret", event()))))).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });

  it("signed order.paid → re-reads the order from Razorpay, remembers the buyer, 200", async () => {
    const f = razorpay(rzpOrder());
    const env = testEnv();
    expect((await handleWebhook(ctx(signed(event()), env))).status).toBe(200);
    expect(f.mock.calls[0]![0]).toBe(`https://api.razorpay.com/v1/orders/${ORDER_ID}`);
    expect(await findPaidOrder(readEnv(env), { email: "priya@example.com" })).toBe(ORDER_ID);
  });

  it("payment.captured is handled the same way; other events and foreign ids are ignored", async () => {
    const f = razorpay(rzpOrder());
    expect((await handleWebhook(ctx(signed(event("payment.captured"))))).status).toBe(200);
    expect(f).toHaveBeenCalledTimes(1);
    expect((await handleWebhook(ctx(signed(event("payment.failed"))))).status).toBe(200);
    expect((await handleWebhook(ctx(signed(event("order.paid", "someone_elses_order"))))).status).toBe(200);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("the same delivery twice is processed once", async () => {
    const f = razorpay(rzpOrder());
    const raw = event();
    const env = testEnv();
    await handleWebhook(ctx(signed(raw), env));
    await handleWebhook(ctx(signed(raw), env));
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("Razorpay unreachable → 503 so Razorpay retries", async () => {
    mockFetch(() => jsonResponse({}, 500));
    expect((await handleWebhook(ctx(signed(event())))).status).toBe(503);
  });

  it("signed but not JSON → 400; too big → 413", async () => {
    expect((await handleWebhook(ctx(signed("not json")))).status).toBe(400);
    expect((await handleWebhook(ctx(signed("x".repeat(70_000))))).status).toBe(413);
  });
});
