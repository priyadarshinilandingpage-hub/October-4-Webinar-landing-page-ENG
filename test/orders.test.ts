import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rememberBuyer, resetBuyersForTests } from "@/server/buyers";
import { readEnv } from "@/server/env";
import { resetRateLimitForTests } from "@/server/ratelimit";
import { handleCreateOrder, resetOrdersForTests } from "@/server/routes/orders";
import { ctx, jsonResponse, KEY_ID, KEY_SECRET, mockFetch, ORDER_ID, SITE, testEnv } from "./helpers";

let ip = 0;
let n = 0;

function lead(over: Record<string, unknown> = {}) {
  return {
    name: "Priya Raman",
    email: `priya${++n}@example.com`,
    phone: "+91 98765 43210",
    consent: true,
    marketingConsent: false,
    website: "",
    elapsedMs: 9_000,
    ...over,
  };
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${SITE}/api/orders`, {
    method: "POST",
    headers: { origin: SITE, "content-type": "application/json", "cf-connecting-ip": `203.0.113.${++ip}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const razorpayOk = () => mockFetch(() => jsonResponse({ id: ORDER_ID, amount: 9900, amount_paid: 0, currency: "INR", status: "created" }));
const post = (r: Request, env = testEnv()) => handleCreateOrder(ctx(r, env));

beforeEach(() => {
  resetOrdersForTests();
  resetRateLimitForTests();
  resetBuyersForTests();
  vi.useFakeTimers({ now: new Date("2026-09-30T10:00:00+05:30"), toFake: ["Date"] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("POST /api/orders", () => {
  it("success: only public checkout details come back; Razorpay gets ₹99 (9900 paise) INR with server auth", async () => {
    const f = razorpayOk();
    const res = await post(req(lead({ utmSource: "facebook", utmContent: "creative_b" }), { "user-agent": "Mozilla/5.0 Test", cookie: "_fbp=fb.1.1790000000000.123456789" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toMatchObject({ orderId: ORDER_ID, keyId: KEY_ID, amount: 9900, currency: "INR", callbackUrl: `${SITE}/api/razorpay/callback` });
    expect(body.prefill).toEqual({ name: "Priya Raman", email: expect.stringMatching(/@example\.com$/), contact: "+919876543210" });
    expect(JSON.stringify(body)).not.toContain(KEY_SECRET);

    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://api.razorpay.com/v1/orders");
    expect((init!.headers as Record<string, string>).authorization).toBe(`Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`);
    const sent = JSON.parse(String(init!.body));
    expect(sent.amount).toBe(9900);
    expect(sent.currency).toBe("INR");
    expect(sent.receipt).toMatch(/^wb_[0-9a-f]{24}$/);
    expect(sent.notes).toMatchObject({ phone: "9876543210", consent_marketing: "false", utm_source: "facebook", utm_content: "creative_b", ua: "Mozilla/5.0 Test", fbp: "fb.1.1790000000000.123456789" });
  });

  it("a client-sent amount is rejected and never reaches Razorpay", async () => {
    const f = razorpayOk();
    const res = await post(req(lead({ amount: 1 })));
    expect(res.status).toBe(422);
    expect(JSON.stringify(await res.json())).not.toMatch(/amount/i);
    expect(f).not.toHaveBeenCalled();
  });

  it("another site can't start orders (Origin check) → 403", async () => {
    const f = razorpayOk();
    expect((await post(req(lead(), { origin: "https://evil.example" }))).status).toBe(403);
    const r = req(lead());
    r.headers.delete("origin");
    expect((await post(r)).status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it("the www. and bare forms of the site address both work", async () => {
    const f = razorpayOk();
    expect((await post(req(lead(), { origin: "https://www.webinar.example.in" }))).status).toBe(200);
    expect((await post(req(lead(), { origin: "https://www.evil.example" }))).status).toBe(403);
    expect((await post(req(lead(), { origin: "http://webinar.example.in" }))).status).toBe(403);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("wrong content type → 415, bad JSON → 400, oversized → 413", async () => {
    razorpayOk();
    expect((await post(req("name=x", { "content-type": "application/x-www-form-urlencoded" }))).status).toBe(415);
    expect((await post(req("{not json"))).status).toBe(400);
    expect((await post(req(lead({ name: "a".repeat(10_000) })))).status).toBe(413);
  });

  it("validation error → 422 with the field to fix", async () => {
    const res = await post(req(lead({ phone: "12345" })));
    expect(res.status).toBe(422);
    expect((await res.json()).field).toBe("phone");
  });

  it("bots (honeypot, instant submit) → 400 without calling Razorpay", async () => {
    const f = razorpayOk();
    expect((await post(req(lead({ website: "http://spam.example" })))).status).toBe(400);
    expect((await post(req(lead({ elapsedMs: 300 })))).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it("already paid with the same email or number → 409 alreadyPaid, no second order", async () => {
    const env = testEnv();
    await rememberBuyer(readEnv(env), ORDER_ID, { email: "paid@example.com", phone: "9000000001" });
    const f = razorpayOk();
    const a = await post(req(lead({ email: "paid@example.com" })), env);
    expect(a.status).toBe(409);
    expect(await a.json()).toEqual({ alreadyPaid: true, error: "You have already paid for this webinar." });
    expect((await post(req(lead({ phone: "+91 90000 00001" })), env)).status).toBe(409);
    expect((await post(req(lead({ name: "Priya Raman" })), env)).status).toBe(200); // same name only: allowed
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("a double submit returns the same checkout instead of a second order", async () => {
    const f = razorpayOk();
    const same = lead();
    const a = await (await post(req(same))).json();
    const b = await (await post(req(same))).json();
    expect(a).toEqual(b);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("Razorpay error → 502 with a generic message", async () => {
    mockFetch(() => jsonResponse({ error: { code: "BAD_REQUEST_ERROR", description: "Authentication failed" } }, 401));
    const res = await post(req(lead()));
    expect(res.status).toBe(502);
    expect(await res.text()).toBe(JSON.stringify({ error: "Couldn't start the payment. Please try again." }));
  });

  it("rate limit: the 11th attempt from one IP within 10 minutes → 429", async () => {
    razorpayOk();
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await post(req(lead(), { "cf-connecting-ip": "198.51.100.7" }))).status);
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("no real visitor address (the proxy didn't pass it): not limited, so buyers never block each other", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    razorpayOk();
    const statuses: number[] = [];
    for (const ip of ["127.0.0.1", "::1", "10.0.0.2", "192.168.1.9", "unknown"]) {
      for (let i = 0; i < 3; i++) statuses.push((await post(req(lead(), { "cf-connecting-ip": ip }))).status);
    }
    for (let i = 0; i < 11; i++) statuses.push((await post(req(lead(), { "cf-connecting-ip": "127.0.0.1" }))).status);
    expect(statuses.every((s) => s === 200)).toBe(true);
    warn.mockRestore();
  });

  it("after the session has started (+30 min) → 410", async () => {
    vi.setSystemTime(new Date("2026-10-04T12:00:00+05:30"));
    const f = razorpayOk();
    expect((await post(req(lead()))).status).toBe(410);
    expect(f).not.toHaveBeenCalled();
  });

  it("missing or bad keys → 503, never a crash", async () => {
    expect((await post(req(lead()), testEnv({ RAZORPAY_KEY_ID: "not-a-key" }))).status).toBe(503);
    expect((await post(req(lead()), testEnv({ RAZORPAY_KEY_SECRET: "" }))).status).toBe(503);
    expect((await post(req(lead()), testEnv({ SITE_URL: "my-site.in" }))).status).toBe(503);
  });

  it("a malformed OPTIONAL setting is ignored with a warning; payments keep working", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    razorpayOk();
    const env = testEnv({ WEBINAR_WHATSAPP_URL: "chat.whatsapp.com/abc", META_PIXEL_ID: "not-a-number" });
    expect((await post(req(lead()), env)).status).toBe(200);
    const parsed = readEnv(env);
    expect([...parsed.ignored].sort()).toEqual(["META_PIXEL_ID", "WEBINAR_WHATSAPP_URL"]);
    expect(parsed.WEBINAR_WHATSAPP_URL).toBeUndefined();
    expect(parsed.RAZORPAY_KEY_ID).toBe(KEY_ID);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("live keys require an https SITE_URL", async () => {
    expect(() => readEnv(testEnv({ RAZORPAY_KEY_ID: "rzp_live_AbCdEfGh12345678", SITE_URL: "http://localhost:8788" }))).toThrow(/SITE_URL/);
  });
});
