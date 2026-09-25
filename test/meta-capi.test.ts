import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, mockFetch, ORDER_ID, paidOrder } from "./helpers";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

// env() caches its result, so each test re-imports the modules after setting variables.
async function load() {
  vi.resetModules();
  return import("@/lib/meta-capi");
}

beforeEach(() => {
  vi.stubEnv("META_PIXEL_ID", "123456789012345");
  vi.stubEnv("META_CAPI_TOKEN", "EAAB_fake_token_for_tests_only_000000");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("meta CAPI hashing", () => {
  it("normalises before hashing", async () => {
    const m = await load();
    expect(m.hashEmail("  Priya@Example.COM ")).toBe(sha("priya@example.com"));
    expect(m.hashPhone("9876543210")).toBe(sha("919876543210"));
    expect(m.hashPhone("+91 98765-43210")).toBe(sha("919876543210"));
    expect(m.hashPhone("12345")).toBeUndefined();
    expect(m.hashFirstName("  Priya Raman")).toBe(sha("priya"));
    expect(m.hashFirstName("O'Neil")).toBe(sha("oneil"));
  });
});

describe("sendPurchaseEvent", () => {
  it("sends for every buyer: the marketing box only controls promotional messages", async () => {
    const m = await load();
    const f = mockFetch(() => jsonResponse({ events_received: 1 }));
    await expect(m.sendPurchaseEvent(paidOrder({ order_tags: { consent_marketing: "false" } }) as never)).resolves.toBe("sent");
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("skips when Meta isn't configured", async () => {
    vi.stubEnv("META_CAPI_TOKEN", "");
    const m = await load();
    const f = mockFetch(() => jsonResponse({}));
    await expect(m.sendPurchaseEvent(paidOrder({ order_tags: { consent_marketing: "true" } }) as never)).resolves.toBe("skipped");
    expect(f).not.toHaveBeenCalled();
  });

  it("sends hashed data only, with event_id = order_id, token in the body", async () => {
    const m = await load();
    const f = mockFetch(() => jsonResponse({ events_received: 1 }));
    const order = paidOrder({ order_tags: { consent_marketing: "true", ua: "Mozilla/5.0 Test" } });
    await expect(m.sendPurchaseEvent(order as never, 1_790_000_000_000)).resolves.toBe("sent");

    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://graph.facebook.com/v24.0/123456789012345/events");
    expect(url).not.toContain("access_token");
    const raw = String(init!.body);
    expect(raw).not.toContain("priya@example.com");
    expect(raw).not.toContain("9876543210");
    expect(raw).not.toContain("Priya");
    const body = JSON.parse(raw);
    const ev = body.data[0];
    expect(ev).toMatchObject({ event_name: "Purchase", event_id: ORDER_ID, action_source: "website", event_time: 1_790_000_000 });
    expect(ev.user_data).toEqual({
      em: [sha("priya@example.com")],
      ph: [sha("919876543210")],
      fn: [sha("priya")],
      client_user_agent: "Mozilla/5.0 Test",
    });
    expect(ev.custom_data).toMatchObject({ currency: "INR", value: 99 });
  });

  it("never throws when Meta is down", async () => {
    const m = await load();
    mockFetch(() => {
      throw new TypeError("fetch failed");
    });
    await expect(m.sendPurchaseEvent(paidOrder({ order_tags: { consent_marketing: "true" } }) as never)).resolves.toBe("failed");
  });
});
