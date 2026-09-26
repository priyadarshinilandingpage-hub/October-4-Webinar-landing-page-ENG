import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readEnv } from "@/server/env";
import { hashEmail, hashFirstName, hashPhone, sendPurchaseEvent } from "@/server/meta-capi";
import { toPaidOrder } from "@/server/order";
import type { RazorpayOrder } from "@/server/razorpay";
import { jsonResponse, mockFetch, ORDER_ID, rzpOrder, testEnv } from "./helpers";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const env = (over: Record<string, string> = {}) =>
  readEnv(testEnv({ META_PIXEL_ID: "123456789012345", META_CAPI_TOKEN: "EAAB_fake_token_for_tests_only_000000", ...over }));
const order = () =>
  toPaidOrder(rzpOrder({ notes: { name: "Priya Raman", email: "priya@example.com", phone: "9876543210", ua: "Mozilla/5.0 Test" } }) as unknown as RazorpayOrder);

afterEach(() => vi.unstubAllGlobals());

describe("meta CAPI", () => {
  it("normalises before hashing", async () => {
    expect(await hashEmail("  Priya@Example.COM ")).toBe(sha("priya@example.com"));
    expect(await hashPhone("+91 98765-43210")).toBe(sha("919876543210"));
    expect(await hashPhone("12345")).toBeUndefined();
    expect(await hashFirstName("  Priya Raman")).toBe(sha("priya"));
  });

  it("sends hashed data only, event_id = order id, token in the body", async () => {
    const f = mockFetch(() => jsonResponse({ events_received: 1 }));
    await expect(sendPurchaseEvent(env(), order(), 1_790_000_000_000)).resolves.toBe("sent");
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://graph.facebook.com/v24.0/123456789012345/events");
    const raw = String(init!.body);
    expect(raw).not.toContain("priya@example.com");
    expect(raw).not.toContain("9876543210");
    const ev = JSON.parse(raw).data[0];
    expect(ev).toMatchObject({ event_name: "Purchase", event_id: ORDER_ID, action_source: "website", event_time: 1_790_000_000 });
    expect(ev.user_data).toEqual({ em: [sha("priya@example.com")], ph: [sha("919876543210")], fn: [sha("priya")], client_user_agent: "Mozilla/5.0 Test" });
    expect(ev.custom_data).toMatchObject({ currency: "INR", value: 99 });
  });

  it("skips when Meta isn't configured, and never throws when Meta is down", async () => {
    const f = mockFetch(() => jsonResponse({}));
    await expect(sendPurchaseEvent(env({ META_CAPI_TOKEN: "" }), order())).resolves.toBe("skipped");
    expect(f).not.toHaveBeenCalled();
    mockFetch(() => {
      throw new TypeError("fetch failed");
    });
    await expect(sendPurchaseEvent(env(), order())).resolves.toBe("failed");
  });
});
