import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createOrderRoute } from "@/app/api/orders/route";
import { POST as webhookRoute } from "@/app/api/webhooks/cashfree/route";
import { findPaidOrder, rememberBuyer, resetBuyersForTests } from "@/lib/buyers";
import { resetFulfilForTests } from "@/lib/fulfil";
import { jsonResponse, mockFetch, ORDER_ID, paidOrder, sign, SITE } from "./helpers";

const OTHER_ORDER = "wb_ffffffffffffffffffffffffffffffff";
let ip = 0;

function orderReq(over: Record<string, unknown> = {}) {
  const body = {
    name: "Priya Raman",
    email: "priya@example.com",
    phone: "98765 43210",
    consent: true,
    marketingConsent: false,
    website: "",
    elapsedMs: 9_000,
    ...over,
  };
  return new NextRequest(`${SITE}/api/orders`, {
    method: "POST",
    headers: { origin: SITE, "content-type": "application/json", "x-forwarded-for": `192.0.2.${++ip}` },
    body: JSON.stringify(body),
  });
}

function paidWebhook(orderId = ORDER_ID) {
  const raw = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: orderId }, payment: { cf_payment_id: String(++ip) } } });
  const ts = String(Date.now());
  return new NextRequest(`${SITE}/api/webhooks/cashfree`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-webhook-timestamp": ts, "x-webhook-signature": sign(raw, ts) },
    body: raw,
  });
}

beforeEach(() => {
  resetBuyersForTests();
  resetFulfilForTests();
  vi.useFakeTimers({ now: new Date("2026-09-30T10:00:00+05:30"), toFake: ["Date"] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("already-paid list (lib/buyers)", () => {
  it("matches on email OR phone, whatever the formatting", async () => {
    await rememberBuyer(ORDER_ID, { email: "priya@example.com", phone: "9876543210" });
    expect(await findPaidOrder({ email: "  PRIYA@Example.com ", phone: "9000000001" })).toBe(ORDER_ID);
    expect(await findPaidOrder({ email: "someone.else@example.com", phone: "+91 98765-43210" })).toBe(ORDER_ID);
    expect(await findPaidOrder({ email: "someone.else@example.com", phone: "9000000001" })).toBeNull();
  });

  it("the same order saved twice is not a duplicate; a second paid order for the same person is", async () => {
    expect(await rememberBuyer(ORDER_ID, { email: "priya@example.com", phone: "9876543210" })).toEqual({});
    expect(await rememberBuyer(ORDER_ID, { email: "priya@example.com", phone: "9876543210" })).toEqual({});
    expect(await rememberBuyer(OTHER_ORDER, { email: "new@example.com", phone: "9876543210" })).toEqual({ duplicateOf: ORDER_ID });
    // The first order stays the one on record.
    expect(await findPaidOrder({ phone: "9876543210" })).toBe(ORDER_ID);
  });

  it("missing or unusable contact details never match anyone", async () => {
    await rememberBuyer(ORDER_ID, { email: null, phone: "12345" });
    expect(await findPaidOrder({ email: "", phone: "12345" })).toBeNull();
  });
});

describe("paying twice", () => {
  it("after a verified payment, the same email → 409 alreadyPaid and no second Cashfree order", async () => {
    mockFetch(() => jsonResponse(paidOrder()));
    expect((await webhookRoute(paidWebhook())).status).toBe(200);

    const f = mockFetch(() => jsonResponse({ order_id: "x", payment_session_id: "session_2", order_status: "ACTIVE" }));
    const res = await createOrderRoute(orderReq({ phone: "9000000001" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({ alreadyPaid: true, error: "You have already paid for this webinar." });
    expect(JSON.stringify(body)).not.toContain("wb_"); // never reveals the earlier order (its link unlocks the group)
    expect(f).not.toHaveBeenCalled();
  });

  it("same WhatsApp number with a different email → still blocked", async () => {
    mockFetch(() => jsonResponse(paidOrder()));
    await webhookRoute(paidWebhook());
    mockFetch(() => jsonResponse({ order_id: "x", payment_session_id: "s", order_status: "ACTIVE" }));
    expect((await createOrderRoute(orderReq({ email: "other@example.com", phone: "+91 98765 43210" }))).status).toBe(409);
  });

  it("same name only (different email and number) → allowed, names are not unique", async () => {
    mockFetch(() => jsonResponse(paidOrder()));
    await webhookRoute(paidWebhook());
    mockFetch(() => jsonResponse({ order_id: "x", payment_session_id: "session_ok", order_status: "ACTIVE" }));
    const res = await createOrderRoute(orderReq({ email: "priya.r@example.com", phone: "9000000002" }));
    expect(res.status).toBe(200);
    expect((await res.json()).paymentSessionId).toBe("session_ok");
  });

  it("an unpaid or wrong-amount order is never remembered", async () => {
    mockFetch(() => jsonResponse(paidOrder({ order_amount: 1 })));
    await webhookRoute(paidWebhook());
    expect(await findPaidOrder({ email: "priya@example.com", phone: "9876543210" })).toBeNull();
  });
});
