import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/webhooks/cashfree/route";
import { jsonResponse, mockFetch, ORDER_ID, paidOrder, sign, SITE } from "./helpers";

let n = 0;
function event(type = "PAYMENT_SUCCESS_WEBHOOK", orderId = ORDER_ID) {
  // A unique field per call so the per-payload de-duplication doesn't hide later tests.
  return JSON.stringify({
    type,
    event_time: new Date().toISOString(),
    data: { order: { order_id: orderId, order_amount: 99, order_currency: "INR" }, payment: { cf_payment_id: String(++n), payment_status: "SUCCESS" } },
  });
}

function webhook(raw: string, headers: Record<string, string>) {
  return new NextRequest(`${SITE}/api/webhooks/cashfree`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: raw });
}

function signed(raw: string) {
  const ts = String(Date.now());
  return webhook(raw, { "x-webhook-timestamp": ts, "x-webhook-signature": sign(raw, ts) });
}

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/webhooks/cashfree", () => {
  it("unsigned → 401", async () => {
    const f = mockFetch(() => jsonResponse(paidOrder()));
    expect((await POST(webhook(event(), {}))).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });

  it("bad signature → 401", async () => {
    const raw = event();
    const ts = String(Date.now());
    expect((await POST(webhook(raw, { "x-webhook-timestamp": ts, "x-webhook-signature": sign(raw, ts, "cfsk_ma_test_wrong_secret") }))).status).toBe(401);
  });

  it("signed success → re-reads the order from Cashfree and returns 200", async () => {
    const f = mockFetch(() => jsonResponse(paidOrder()));
    const res = await POST(signed(event()));
    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(1); // Get Order only: Meta CAPI is not configured in tests
    expect(f.mock.calls[0]![0]).toBe(`https://sandbox.cashfree.com/pg/orders/${ORDER_ID}`);
  });

  it("the same delivery twice is processed once", async () => {
    const f = mockFetch(() => jsonResponse(paidOrder()));
    const raw = event();
    expect((await POST(signed(raw))).status).toBe(200);
    expect((await POST(signed(raw))).status).toBe(200);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("Cashfree lookup failing → 503 so Cashfree retries", async () => {
    mockFetch(() => jsonResponse({}, 500));
    expect((await POST(signed(event()))).status).toBe(503);
  });

  it("other event types and foreign order ids → 200 without calling Cashfree", async () => {
    const f = mockFetch(() => jsonResponse(paidOrder()));
    expect((await POST(signed(event("PAYMENT_FAILED_WEBHOOK")))).status).toBe(200);
    expect((await POST(signed(event("PAYMENT_SUCCESS_WEBHOOK", "someone_elses_order")))).status).toBe(200);
    expect(f).not.toHaveBeenCalled();
  });

  it("signed but not JSON → 400", async () => {
    expect((await POST(signed("not json"))).status).toBe(400);
  });

  it("oversized body → 413", async () => {
    expect((await POST(signed("x".repeat(70_000)))).status).toBe(413);
  });
});
