import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/orders/route";
import { jsonResponse, mockFetch, SITE } from "./helpers";

let ipCounter = 0;
let emailCounter = 0;

function lead(over: Record<string, unknown> = {}) {
  return {
    name: "Priya Raman",
    email: `priya${++emailCounter}@example.com`,
    phone: "+91 98765 43210",
    consent: true,
    marketingConsent: false,
    website: "",
    elapsedMs: 9_000,
    ...over,
  };
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`${SITE}/api/orders`, {
    method: "POST",
    headers: {
      origin: SITE,
      "content-type": "application/json",
      "x-forwarded-for": `203.0.113.${++ipCounter}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const cashfreeOk = () =>
  mockFetch(() => jsonResponse({ order_id: "x", payment_session_id: "session_test_123", order_status: "ACTIVE", cf_order_id: "99", customer_details: {} }));

beforeEach(() => {
  // Before the webinar, so registrations are open. Only Date is faked (timers/promises stay real).
  vi.useFakeTimers({ now: new Date("2026-09-30T10:00:00+05:30"), toFake: ["Date"] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("POST /api/orders", () => {
  it("wrong Origin → 403, no Cashfree call", async () => {
    const f = cashfreeOk();
    const res = await POST(req(lead(), { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it("missing Origin → 403", async () => {
    const r = req(lead());
    r.headers.delete("origin");
    expect((await POST(r)).status).toBe(403);
  });

  it("non-JSON content type → 415", async () => {
    expect((await POST(req("name=x", { "content-type": "application/x-www-form-urlencoded" }))).status).toBe(415);
  });

  it("bad JSON → 400", async () => {
    const res = await POST(req("{not json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request" });
  });

  it("oversized body → 413", async () => {
    const res = await POST(req(lead({ name: "a".repeat(10_000) })));
    expect(res.status).toBe(413);
  });

  it("validation error → 422 with a field hint", async () => {
    const res = await POST(req(lead({ phone: "12345" })));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.field).toBe("phone");
    expect(typeof body.error).toBe("string");
  });

  it("a client-sent amount is rejected (strict schema) and never reaches Cashfree", async () => {
    const f = cashfreeOk();
    const res = await POST(req(lead({ amount: 1, order_amount: 1 })));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.field).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/amount/i); // generic message, no schema internals
    expect(f).not.toHaveBeenCalled();
  });

  it("honeypot filled → 400, no Cashfree call", async () => {
    const f = cashfreeOk();
    const res = await POST(req(lead({ website: "http://spam.example" })));
    expect(res.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it("submitted too fast → 400", async () => {
    const f = cashfreeOk();
    expect((await POST(req(lead({ elapsedMs: 300 })))).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it("success → only paymentSessionId + mode; Cashfree gets ₹99.00 INR and server-built URLs", async () => {
    const f = cashfreeOk();
    const res = await POST(req(lead({ utmSource: "facebook", utmContent: "creative_a" })));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toEqual({ paymentSessionId: "session_test_123", mode: "sandbox" });

    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://sandbox.cashfree.com/pg/orders");
    const sent = JSON.parse(String(init!.body));
    expect(sent.order_amount).toBe(99);
    expect(sent.order_currency).toBe("INR");
    expect(sent.customer_details.customer_phone).toBe("9876543210");
    expect(sent.order_meta.return_url.startsWith(`${SITE}/thank-you?order_id=wb_`)).toBe(true);
    expect(sent.order_tags).toEqual({ consent_marketing: "false", utm_source: "facebook", utm_content: "creative_a" });
  });

  it("adds the browser and Pixel cookie tags Meta CAPI needs, with or without marketing consent", async () => {
    const f = cashfreeOk();
    await POST(req(lead({ marketingConsent: false }), { "user-agent": "Mozilla/5.0 Test", cookie: "_fbp=fb.1.1790000000000.123456789; _fbc=bad value" }));
    const tags = JSON.parse(String(f.mock.calls[0]![1]!.body)).order_tags;
    expect(tags).toMatchObject({ consent_marketing: "false", ua: "Mozilla/5.0 Test", fbp: "fb.1.1790000000000.123456789" });
    expect(tags).not.toHaveProperty("fbc"); // malformed cookie values are dropped
  });

  it("a name too short for Cashfree is kept in a tag for the registrations table", async () => {
    const f = cashfreeOk();
    await POST(req(lead({ name: "Om" })));
    const sent = JSON.parse(String(f.mock.calls[0]![1]!.body));
    expect(sent.customer_details).not.toHaveProperty("customer_name");
    expect(sent.order_tags.short_name).toBe("Om");
  });

  it("a double submit returns the same checkout instead of a second order", async () => {
    const f = cashfreeOk();
    const same = lead();
    const a = await (await POST(req(same))).json();
    const b = await (await POST(req(same))).json();
    expect(a).toEqual(b);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("Cashfree error → 502 with a generic message (no Cashfree body leaks)", async () => {
    mockFetch(() => jsonResponse({ code: "authentication_failed", message: "authentication Failed", help: "secret-ish detail" }, 401));
    const res = await POST(req(lead()));
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(text).toBe(JSON.stringify({ error: "Couldn't start the payment. Please try again." }));
  });

  it("rate limit: the 11th attempt from one IP within 10 minutes → 429", async () => {
    cashfreeOk();
    const ip = { "x-forwarded-for": "198.51.100.77" };
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await POST(req(lead(), ip))).status);
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("after the session has started (+30 min) → 410, no order", async () => {
    vi.setSystemTime(new Date("2026-10-04T12:00:00+05:30"));
    const f = cashfreeOk();
    expect((await POST(req(lead()))).status).toBe(410);
    expect(f).not.toHaveBeenCalled();
  });
});
