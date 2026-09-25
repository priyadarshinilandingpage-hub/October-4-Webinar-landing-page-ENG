import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { findPaidOrder } from "@/lib/buyers";
import { createOrder, newOrderId } from "@/lib/cashfree";
import { env } from "@/lib/env";
import { fail, json, readBodyLimited } from "@/lib/http";
import { OFFER } from "@/lib/offer";
import { allow, clientIp } from "@/lib/ratelimit";
import { leadSchema, USER_FIELDS } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;
const MIN_FILL_MS = 2_500; // people take longer than this to fill the form
/** Sales stop 30 minutes after the session starts, so nobody pays for a webinar that's over. */
const CLOSES_AT = Date.parse(OFFER.startsAtIso) + 30 * 60_000;
/** Identical submissions within this window get the same checkout (double-clicks, two tabs). */
const DEDUPE_MS = 2 * 60_000;

const recent = new Map<string, { at: number; paymentSessionId: string }>();

/** Order expiry: 1 hour, but not past the close time; Cashfree needs it comfortably in the future. */
function expiryFor(now: number): Date {
  return new Date(Math.max(now + 20 * 60_000, Math.min(now + 60 * 60_000, CLOSES_AT)));
}

const printable = (v: string, max: number) => v.replace(/[^\x20-\x7E]/g, "").slice(0, max);
const FB_COOKIE_RE = /^fb\.\d\.\d{10,16}\.[A-Za-z0-9_.-]{1,200}$/;

/**
 * Creates a Cashfree order for the fixed webinar price and returns ONLY the payment session id.
 * The browser sends lead details; amount, currency, order id and redirect URLs are decided here.
 */
export async function POST(req: NextRequest) {
  let e;
  try {
    e = env();
  } catch (err) {
    console.error("[orders] config", (err as Error).message);
    return fail(503, "Registration is temporarily unavailable. Please try again shortly.");
  }

  // Same-origin only: other sites can't create orders through this endpoint (CSRF), and no CORS headers are sent.
  const origin = req.headers.get("origin");
  const devOk = process.env.NODE_ENV === "development" && origin === req.nextUrl.origin;
  if (origin !== e.SITE_URL && !devOk) return fail(403, "Forbidden");
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return fail(415, "Unsupported request");

  const now = Date.now();
  if (now > CLOSES_AT) return fail(410, "Registrations for this session have closed.");

  if (!(await allow("order", clientIp(req.headers)))) {
    return fail(429, "Too many attempts. Please wait a few minutes and try again.");
  }

  const raw = await readBodyLimited(req, MAX_BODY_BYTES);
  if (raw === null) return fail(413, "Request too large");

  let body: unknown;
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    return fail(400, "Invalid request");
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    if (typeof field === "string" && (USER_FIELDS as readonly string[]).includes(field)) {
      return fail(422, issue!.message, field);
    }
    return fail(422, "Please check your details and try again.");
  }
  const lead = parsed.data;

  // Bots: a filled hidden field or an instant submit. Generic answer, no Cashfree call.
  if (lead.website !== "" || lead.elapsedMs < MIN_FILL_MS) return fail(400, "Please try again.");

  // Already paid with this email or WhatsApp number: no second order. The browser only learns "already paid",
  // never which order or which field matched (that order's thank-you link unlocks the buyers' group).
  if (await findPaidOrder({ email: lead.email, phone: lead.phone })) {
    return json({ alreadyPaid: true, error: "You have already paid for this webinar." }, 409);
  }

  const dedupeKey = createHash("sha256")
    .update(JSON.stringify([lead.name, lead.email, lead.phone, lead.marketingConsent]))
    .digest("hex");
  const cached = recent.get(dedupeKey);
  if (cached && now - cached.at < DEDUPE_MS) {
    return json({ paymentSessionId: cached.paymentSessionId, mode: e.CASHFREE_ENV });
  }

  // Order tags are visible in the Cashfree dashboard. Only non-sensitive, needed values go here.
  const tags: Record<string, string> = { consent_marketing: String(lead.marketingConsent) };
  if (lead.utmSource) tags.utm_source = lead.utmSource;
  if (lead.utmCampaign) tags.utm_campaign = lead.utmCampaign;
  if (lead.utmContent) tags.utm_content = lead.utmContent;
  // Cashfree drops names under 3 characters (see createOrder); kept here so the registrations row has it.
  if (lead.name.length < 3) tags.short_name = lead.name;
  // Needed by Meta's Conversions API to match the purchase to the ad click (Pixel cookies + browser).
  const ua = printable(req.headers.get("user-agent") ?? "", 250);
  if (ua) tags.ua = ua;
  const fbp = req.cookies.get("_fbp")?.value;
  const fbc = req.cookies.get("_fbc")?.value;
  if (fbp && FB_COOKIE_RE.test(fbp)) tags.fbp = fbp;
  if (fbc && FB_COOKIE_RE.test(fbc)) tags.fbc = fbc;

  const ids = newOrderId();
  try {
    const order = await createOrder(ids, { name: lead.name, email: lead.email, phone: lead.phone }, tags, expiryFor(now));
    if (!order.payment_session_id) throw new Error("missing payment_session_id");
    if (recent.size > 5_000) recent.clear();
    recent.set(dedupeKey, { at: now, paymentSessionId: order.payment_session_id });
    // Only what the checkout needs. No order details, no customer data, no Cashfree response.
    return json({ paymentSessionId: order.payment_session_id, mode: e.CASHFREE_ENV });
  } catch (err) {
    console.error("[orders] create failed", ids.orderId, (err as Error).message);
    return fail(502, "Couldn't start the payment. Please try again.");
  }
}
