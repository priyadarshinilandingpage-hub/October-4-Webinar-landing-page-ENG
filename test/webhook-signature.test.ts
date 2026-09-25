import { describe, expect, it } from "vitest";
import { verifyWebhookSignature, WEBHOOK_TOLERANCE_MS } from "@/lib/cashfree";
import { sign } from "./helpers";

const body = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "wb_x", order_amount: 99 } } });
const now = 1_790_000_000_000; // fixed clock (ms)
const tsMs = String(now - 1_000);

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature over timestamp + raw body", () => {
    expect(verifyWebhookSignature(body, tsMs, sign(body, tsMs), now)).toBe(true);
  });

  it("accepts the raw body as bytes", () => {
    expect(verifyWebhookSignature(Buffer.from(body), tsMs, sign(body, tsMs), now)).toBe(true);
  });

  it("rejects a signature made with a different secret", () => {
    expect(verifyWebhookSignature(body, tsMs, sign(body, tsMs, "cfsk_ma_test_someone_else"), now)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const sig = sign(body, tsMs);
    const tampered = body.replace('"order_amount":99', '"order_amount":1');
    expect(tampered).not.toBe(body);
    expect(verifyWebhookSignature(tampered, tsMs, sig, now)).toBe(false);
  });

  it("rejects a re-parsed/re-serialised body (whitespace changes the bytes)", () => {
    const sig = sign(body, tsMs);
    expect(verifyWebhookSignature(JSON.stringify(JSON.parse(body), null, 2), tsMs, sig, now)).toBe(false);
  });

  it("rejects a changed timestamp (it is part of the signed payload)", () => {
    const sig = sign(body, tsMs);
    expect(verifyWebhookSignature(body, String(Number(tsMs) + 1), sig, now)).toBe(false);
  });

  it("rejects a stale timestamp even when correctly signed", () => {
    const old = String(now - WEBHOOK_TOLERANCE_MS - 1_000);
    expect(verifyWebhookSignature(body, old, sign(body, old), now)).toBe(false);
  });

  it("rejects a timestamp far in the future", () => {
    const future = String(now + 10 * 60_000);
    expect(verifyWebhookSignature(body, future, sign(body, future), now)).toBe(false);
  });

  it("handles millisecond and second timestamps", () => {
    const secs = String(Math.floor(now / 1000) - 5);
    expect(verifyWebhookSignature(body, secs, sign(body, secs), now)).toBe(true);
    // A seconds value must not be mistaken for milliseconds (that would look ~55 years old).
    const staleSecs = String(Math.floor(now / 1000) - 2 * 60 * 60);
    expect(verifyWebhookSignature(body, staleSecs, sign(body, staleSecs), now)).toBe(false);
  });

  it("rejects missing or malformed headers", () => {
    const sig = sign(body, tsMs);
    expect(verifyWebhookSignature(body, null, sig, now)).toBe(false);
    expect(verifyWebhookSignature(body, tsMs, null, now)).toBe(false);
    expect(verifyWebhookSignature(body, "", sig, now)).toBe(false);
    expect(verifyWebhookSignature(body, "12ab", sig, now)).toBe(false);
    expect(verifyWebhookSignature(body, tsMs, "not base64!", now)).toBe(false);
    expect(verifyWebhookSignature(body, tsMs, sig.slice(0, -4), now)).toBe(false); // truncated
  });
});
