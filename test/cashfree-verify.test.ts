import { afterEach, describe, expect, it, vi } from "vitest";
import { createOrder, newOrderId, ORDER_ID_RE, verifyOrder } from "@/lib/cashfree";
import { jsonResponse, mockFetch, ORDER_ID, paidOrder } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

describe("verifyOrder", () => {
  it("PAID for 99.00 INR → paid, calls the sandbox Get Order endpoint with server-side credentials", async () => {
    const f = mockFetch(() => jsonResponse(paidOrder()));
    const v = await verifyOrder(ORDER_ID);
    expect(v.status).toBe("paid");
    expect(v.firstName).toBe("Priya");
    expect(v.order?.order_id).toBe(ORDER_ID); // server-side only, for lib/fulfil.ts
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe(`https://sandbox.cashfree.com/pg/orders/${ORDER_ID}`);
    const h = init!.headers as Record<string, string>;
    expect(h["x-api-version"]).toBe("2025-01-01");
    expect(h["x-client-id"]).toBe("TEST_fake_client_id");
    expect(h["x-client-secret"]).toBe("cfsk_ma_test_fake_secret_for_unit_tests");
  });

  it("accepts the amount as 99.0 or '99.00'", async () => {
    mockFetch(() => jsonResponse(paidOrder({ order_amount: "99.00" })));
    expect((await verifyOrder(ORDER_ID)).status).toBe("paid");
  });

  it("PAID with 1.00 → failed (someone paid a different amount)", async () => {
    mockFetch(() => jsonResponse(paidOrder({ order_amount: 1 })));
    expect((await verifyOrder(ORDER_ID)).status).toBe("failed");
  });

  it("PAID in USD → failed", async () => {
    mockFetch(() => jsonResponse(paidOrder({ order_currency: "USD" })));
    expect((await verifyOrder(ORDER_ID)).status).toBe("failed");
  });

  it("a response for a different order id → not_found", async () => {
    mockFetch(() => jsonResponse(paidOrder({ order_id: "wb_ffffffffffffffffffffffffffffffff" })));
    expect((await verifyOrder(ORDER_ID)).status).toBe("not_found");
  });

  it("ACTIVE with a payment in progress → pending", async () => {
    mockFetch((url) =>
      url.endsWith("/payments")
        ? jsonResponse([{ payment_status: "PENDING" }])
        : jsonResponse(paidOrder({ order_status: "ACTIVE" })),
    );
    expect((await verifyOrder(ORDER_ID)).status).toBe("pending");
  });

  it("ACTIVE with only failed/dropped payments → unpaid", async () => {
    mockFetch((url) =>
      url.endsWith("/payments")
        ? jsonResponse([{ payment_status: "USER_DROPPED" }, { payment_status: "FAILED" }])
        : jsonResponse(paidOrder({ order_status: "ACTIVE" })),
    );
    expect((await verifyOrder(ORDER_ID)).status).toBe("unpaid");
  });

  it("ACTIVE and the payments lookup fails → pending (conservative)", async () => {
    mockFetch((url) => (url.endsWith("/payments") ? jsonResponse({}, 500) : jsonResponse(paidOrder({ order_status: "ACTIVE" }))));
    expect((await verifyOrder(ORDER_ID)).status).toBe("pending");
  });

  it.each(["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED"])("%s → failed", async (order_status) => {
    mockFetch(() => jsonResponse(paidOrder({ order_status })));
    expect((await verifyOrder(ORDER_ID)).status).toBe("failed");
  });

  it("404 → not_found", async () => {
    mockFetch(() => jsonResponse({ code: "order_not_found", message: "order not found" }, 404));
    expect((await verifyOrder(ORDER_ID)).status).toBe("not_found");
  });

  it("other API errors throw (the page shows 'pending'), without the response body in the message", async () => {
    mockFetch(() => jsonResponse({ code: "request_failed", message: "customer priya@example.com ..." }, 500));
    const err = await verifyOrder(ORDER_ID).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).not.toContain("priya@example.com");
  });

  it.each(["", "abc", "../orders", "wb_0123", "WB_0123456789ABCDEF0123456789ABCDEF", `${ORDER_ID}?x=1`, `${ORDER_ID}/payments`])(
    "bad order id %j → not_found without calling Cashfree",
    async (id) => {
      const f = mockFetch(() => jsonResponse(paidOrder()));
      expect((await verifyOrder(id)).status).toBe("not_found");
      expect(f).not.toHaveBeenCalled();
    },
  );
});

describe("createOrder", () => {
  it("sends the fixed amount/currency, server-built URLs and a UUID idempotency key", async () => {
    const f = mockFetch(() => jsonResponse({ order_id: "x", payment_session_id: "session_abc", order_status: "ACTIVE" }));
    const ids = newOrderId();
    expect(ids.orderId).toMatch(ORDER_ID_RE);
    await createOrder(ids, { name: "Om", email: "om@example.com", phone: "9876543210" }, { consent_marketing: "false" }, new Date("2026-10-01T00:00:00Z"));

    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://sandbox.cashfree.com/pg/orders");
    const h = init!.headers as Record<string, string>;
    expect(h["x-idempotency-key"]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    const sent = JSON.parse(String(init!.body));
    expect(sent.order_amount).toBe(99);
    expect(sent.order_currency).toBe("INR");
    expect(sent.order_id).toBe(ids.orderId);
    expect(sent.order_expiry_time).toBe("2026-10-01T05:30:00+05:30");
    expect(sent.customer_details.customer_id).toMatch(/^[A-Za-z0-9]{3,50}$/);
    expect(sent.customer_details).not.toHaveProperty("customer_name"); // "Om" is below Cashfree's 3-char minimum
    expect(sent.order_meta.return_url).toBe(`https://webinar.example.in/thank-you?order_id=${ids.orderId}`);
    expect(sent.order_meta.notify_url).toBe("https://webinar.example.in/api/webhooks/cashfree");
  });

  it("retries once on a 5xx with the same idempotency key, never on a 4xx", async () => {
    let n = 0;
    const f = mockFetch(() => (++n === 1 ? jsonResponse({}, 503) : jsonResponse({ order_id: "x", payment_session_id: "s", order_status: "ACTIVE" })));
    await createOrder(newOrderId(), { name: "Priya", email: "p@example.com", phone: "9876543210" }, {}, new Date());
    expect(f).toHaveBeenCalledTimes(2);
    const keys = f.mock.calls.map(([, init]) => (init!.headers as Record<string, string>)["x-idempotency-key"]);
    expect(keys[0]).toBe(keys[1]);

    const g = mockFetch(() => jsonResponse({ code: "customer_details.customer_phone_invalid" }, 400));
    await expect(createOrder(newOrderId(), { name: "Priya", email: "p@example.com", phone: "9876543210" }, {}, new Date())).rejects.toThrow(/400/);
    expect(g).toHaveBeenCalledTimes(1);
  });
});
