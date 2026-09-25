import { createHmac } from "node:crypto";
import { vi } from "vitest";

export const SITE = "https://webinar.example.in";
export const SECRET = "cfsk_ma_test_fake_secret_for_unit_tests";
export const ORDER_ID = "wb_0123456789abcdef0123456789abcdef";

/** How Cashfree signs a webhook: base64(HMAC-SHA256(timestamp + rawBody, clientSecret)). */
export function sign(rawBody: string, timestamp: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
}

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

/** Replaces global fetch with a spy that answers through `handler`. */
export function mockFetch(handler: Handler) {
  const spy = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => handler(String(input), init));
  vi.stubGlobal("fetch", spy);
  return spy;
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export function paidOrder(overrides: Record<string, unknown> = {}) {
  return {
    order_id: ORDER_ID,
    order_amount: 99,
    order_currency: "INR",
    order_status: "PAID",
    order_tags: { consent_marketing: "false" },
    customer_details: { customer_name: "Priya Raman", customer_email: "priya@example.com", customer_phone: "9876543210" },
    ...overrides,
  };
}
