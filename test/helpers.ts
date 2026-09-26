import { createHmac } from "node:crypto";
import { vi } from "vitest";
import type { Ctx } from "@/server/http";

export const SITE = "https://webinar.example.in";
export const KEY_ID = "rzp_test_AbCdEfGh12345678";
export const KEY_SECRET = "rzp_test_secret_for_unit_tests_only";
export const WEBHOOK_SECRET = "webhook_secret_for_tests";
export const ORDER_ID = "order_AbCdEfGhIjKlMn";
export const OTHER_ORDER = "order_ZyXwVuTsRqPoNm";
export const PAYMENT_ID = "pay_AbCdEfGhIjKlMn";

/** A fresh, valid test configuration (fake values only). */
export function testEnv(over: Record<string, string> = {}): Record<string, unknown> {
  return { RAZORPAY_KEY_ID: KEY_ID, RAZORPAY_KEY_SECRET: KEY_SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET, SITE_URL: SITE, ...over };
}

/** A Pages Function context. Background work (waitUntil) is collected so tests can await it. */
export function ctx(request: Request, env: Record<string, unknown> = testEnv()): Ctx & { settle: () => Promise<unknown> } {
  const background: Promise<unknown>[] = [];
  return { request, env, waitUntil: (p) => void background.push(p), settle: () => Promise.all(background) };
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

export const hmacHex = (secret: string, message: string) => createHmac("sha256", secret).update(message).digest("hex");

/** A Razorpay order as the API returns it, paid for ₹99 by default. */
export function rzpOrder(over: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    entity: "order",
    amount: 9900,
    amount_paid: 9900,
    amount_due: 0,
    currency: "INR",
    receipt: "wb_0123456789abcdef01234567",
    status: "paid",
    notes: { name: "Priya Raman", email: "priya@example.com", phone: "9876543210", consent_marketing: "false" },
    ...over,
  };
}
