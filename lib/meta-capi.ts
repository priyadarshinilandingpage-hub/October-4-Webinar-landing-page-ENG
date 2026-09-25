import "server-only";
import { createHash } from "node:crypto";
import type { CashfreeOrder } from "./cashfree";
import { env } from "./env";
import { OFFER, ORDER_AMOUNT } from "./offer";

// Optional Meta Conversions API "Purchase" event, sent server-side from the verified payment webhook.
// Active when META_PIXEL_ID and META_CAPI_TOKEN are set. Sent for every buyer (the site owner chose to measure
// ads for all visitors; the privacy page says so). The marketing box only controls promotional messages.
// Personal data is SHA-256 hashed before it leaves the server and is never logged.
// event_id = order_id so Meta de-duplicates it against a browser Pixel "Purchase" with the same eventID.

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

export const hashEmail = (email: string) => sha256(email.trim().toLowerCase());

/** Meta wants digits only, with country code: 9876543210 → 919876543210. */
export function hashPhone(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  const withCc = digits.length === 10 ? `91${digits}` : digits;
  return /^91[6-9]\d{9}$/.test(withCc) ? sha256(withCc) : undefined;
}

/** First word of the name, lowercase, no punctuation or spaces. */
export function hashFirstName(name: string): string | undefined {
  const first = name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^\p{L}\p{M}]/gu, "");
  return first ? sha256(first) : undefined;
}

export function metaCapiEnabled(): boolean {
  const e = env();
  return Boolean(e.META_PIXEL_ID && e.META_CAPI_TOKEN);
}

export type CapiResult = "sent" | "skipped" | "failed";

/** Sends a Purchase for a verified, paid order. Never throws. */
export async function sendPurchaseEvent(order: CashfreeOrder, now = Date.now()): Promise<CapiResult> {
  try {
    const e = env();
    if (!e.META_PIXEL_ID || !e.META_CAPI_TOKEN) return "skipped";

    const c = order.customer_details ?? {};
    const tags = order.order_tags ?? {};
    const em = c.customer_email ? hashEmail(c.customer_email) : undefined;
    const ph = c.customer_phone ? hashPhone(c.customer_phone) : undefined;
    const fn = c.customer_name ? hashFirstName(c.customer_name) : undefined;

    const userData: Record<string, unknown> = {
      ...(em && { em: [em] }),
      ...(ph && { ph: [ph] }),
      ...(fn && { fn: [fn] }),
      ...(tags.ua && { client_user_agent: tags.ua }),
      ...(tags.fbp && { fbp: tags.fbp }),
      ...(tags.fbc && { fbc: tags.fbc }),
    };

    const res = await fetch(`https://graph.facebook.com/${e.META_GRAPH_API_VERSION}/${e.META_PIXEL_ID}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Token goes in the body, not the URL, so it can't end up in proxy/access logs.
      body: JSON.stringify({
        access_token: e.META_CAPI_TOKEN,
        ...(e.META_TEST_EVENT_CODE && { test_event_code: e.META_TEST_EVENT_CODE }),
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor(now / 1000),
            event_id: order.order_id,
            action_source: "website",
            event_source_url: `${e.SITE_URL}/`,
            user_data: userData,
            custom_data: { currency: OFFER.currency, value: Number(ORDER_AMOUNT), content_name: "webinar" },
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      console.warn("[meta-capi] rejected", order.order_id, res.status);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.warn("[meta-capi] error", order.order_id, (err as Error).name);
    return "failed";
  }
}
