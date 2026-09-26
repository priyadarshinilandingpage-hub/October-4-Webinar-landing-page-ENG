import { OFFER, ORDER_AMOUNT } from "../lib/offer";
import { sha256Hex } from "./crypto";
import type { ServerEnv } from "./env";
import type { PaidOrder } from "./order";

// Optional Meta Conversions API "Purchase", sent from the server after a verified payment, for every buyer
// (the site owner chose to measure ads for all visitors; the privacy page says so).
// Personal data is SHA-256 hashed before it leaves the server and is never logged.
// event_id = order id, so Meta merges it with the browser Pixel's Purchase that carries the same eventID.

export const hashEmail = (email: string) => sha256Hex(email.trim().toLowerCase());

/** Meta wants digits only, with country code: 9876543210 → 919876543210. */
export async function hashPhone(phone: string): Promise<string | undefined> {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  const withCc = digits.length === 10 ? `91${digits}` : digits;
  return /^91[6-9]\d{9}$/.test(withCc) ? sha256Hex(withCc) : undefined;
}

export async function hashFirstName(name: string): Promise<string | undefined> {
  const first = name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^\p{L}\p{M}]/gu, "");
  return first ? sha256Hex(first) : undefined;
}

export type CapiResult = "sent" | "skipped" | "failed";

/** Sends a Purchase for a verified, paid order. Never throws. */
export async function sendPurchaseEvent(env: ServerEnv, order: PaidOrder, now = Date.now()): Promise<CapiResult> {
  try {
    if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return "skipped";
    const c = order.customer;
    const t = order.notes;
    const em = c.email ? await hashEmail(c.email) : undefined;
    const ph = c.phone ? await hashPhone(c.phone) : undefined;
    const fn = c.name ? await hashFirstName(c.name) : undefined;
    const userData: Record<string, unknown> = {
      ...(em && { em: [em] }),
      ...(ph && { ph: [ph] }),
      ...(fn && { fn: [fn] }),
      ...(t.ua && { client_user_agent: t.ua }),
      ...(t.fbp && { fbp: t.fbp }),
      ...(t.fbc && { fbc: t.fbc }),
    };
    const res = await fetch(`https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${env.META_PIXEL_ID}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Token in the body, not the URL, so it can't end up in access logs.
      body: JSON.stringify({
        access_token: env.META_CAPI_TOKEN,
        ...(env.META_TEST_EVENT_CODE && { test_event_code: env.META_TEST_EVENT_CODE }),
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor(now / 1000),
            event_id: order.id,
            action_source: "website",
            event_source_url: `${env.SITE_URL}/`,
            user_data: userData,
            custom_data: { currency: OFFER.currency, value: Number(ORDER_AMOUNT), content_name: "webinar" },
          },
        ],
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      console.warn("[meta-capi] rejected", order.id, res.status);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.warn("[meta-capi] error", order.id, (err as Error).name);
    return "failed";
  }
}
