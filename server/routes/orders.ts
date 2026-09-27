import { AMOUNT_PAISE, OFFER } from "../../lib/offer";
import { BUSINESS } from "../../lib/business";
import { leadSchema, USER_FIELDS } from "../../lib/validation";
import { findPaidOrder } from "../buyers";
import { randomHex, sha256Hex } from "../crypto";
import { readEnv, type ServerEnv } from "../env";
import { clientIp, fail, json, readBodyLimited, type Ctx } from "../http";
import { allow } from "../ratelimit";
import { createOrder } from "../razorpay";

// POST /api/orders: creates a Razorpay order for the FIXED webinar price and returns what the browser needs to
// open Razorpay's checkout. The browser sends lead details only; amount, currency and the return address are
// decided here. No secret leaves the server (the key id is public by design).

const MAX_BODY_BYTES = 4_096;
const MIN_FILL_MS = 2_500; // people take longer than this to fill the form
/** Sales stop 30 minutes after the session starts, so nobody pays for a webinar that's over. */
const CLOSES_AT = Date.parse(OFFER.startsAtIso) + 30 * 60_000;
/** Identical submissions within this window get the same checkout (double taps, two tabs). */
const DEDUPE_MS = 2 * 60_000;
const FB_COOKIE_RE = /^fb\.\d\.\d{10,16}\.[A-Za-z0-9_.-]{1,200}$/;

const recent = new Map<string, { at: number; body: unknown }>();
const printable = (v: string, max: number) => v.replace(/[^\x20-\x7E]/g, "").slice(0, max);
const noWww = (origin: string) => origin.replace("://www.", "://");

function cookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export async function handleCreateOrder({ request, env: envRaw }: Ctx, now = Date.now()): Promise<Response> {
  let env: ServerEnv;
  try {
    env = readEnv(envRaw);
  } catch (err) {
    console.error("[orders] config", (err as Error).message);
    return fail(503, "Registration is temporarily unavailable. Please try again shortly.");
  }

  // Same-origin only (CSRF): other sites can't start orders through this endpoint. The www. and bare forms of
  // SITE_URL are the same site (buyers type either).
  const origin = request.headers.get("origin");
  if (!origin || (origin !== new URL(request.url).origin && noWww(origin) !== noWww(env.SITE_URL))) return fail(403, "Forbidden");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return fail(415, "Unsupported request");
  if (now > CLOSES_AT) return fail(410, "Registrations for this session have closed.");
  if (!(await allow(env, "order", clientIp(request), now))) return fail(429, "Too many attempts. Please wait a few minutes and try again.");

  const raw = await readBodyLimited(request, MAX_BODY_BYTES);
  if (raw === null) return fail(413, "Request too large");
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return fail(400, "Invalid request");
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    if (typeof field === "string" && (USER_FIELDS as readonly string[]).includes(field)) return fail(422, issue!.message, field);
    return fail(422, "Please check your details and try again.");
  }
  const lead = parsed.data;

  // Bots: a filled hidden field or an instant submit. Generic answer, no Razorpay call.
  if (lead.website !== "" || lead.elapsedMs < MIN_FILL_MS) return fail(400, "Please try again.");

  // Already paid with this email or WhatsApp number: no second order. The browser learns only "already paid".
  if (await findPaidOrder(env, { email: lead.email, phone: lead.phone })) {
    return json({ alreadyPaid: true, error: "You have already paid for this webinar." }, 409);
  }

  const dedupeKey = await sha256Hex(JSON.stringify([lead.name, lead.email, lead.phone, lead.marketingConsent]));
  const cached = recent.get(dedupeKey);
  if (cached && now - cached.at < DEDUPE_MS) return json(cached.body);

  // Stored on the Razorpay order (visible only in the dashboard). The follow-up steps read the buyer from here.
  const notes: Record<string, string> = {
    name: lead.name.slice(0, 100),
    email: lead.email,
    phone: lead.phone,
    consent_marketing: String(lead.marketingConsent),
  };
  if (lead.utmSource) notes.utm_source = lead.utmSource;
  if (lead.utmCampaign) notes.utm_campaign = lead.utmCampaign;
  if (lead.utmContent) notes.utm_content = lead.utmContent;
  // For Meta's Conversions API: matches the purchase to the ad click.
  const ua = printable(request.headers.get("user-agent") ?? "", 250);
  if (ua) notes.ua = ua;
  const fbp = cookie(request, "_fbp");
  const fbc = cookie(request, "_fbc");
  if (fbp && FB_COOKIE_RE.test(fbp)) notes.fbp = fbp;
  if (fbc && FB_COOKIE_RE.test(fbc)) notes.fbc = fbc;

  const receipt = `wb_${randomHex(12)}`;
  try {
    const order = await createOrder(env, receipt, notes);
    const out = {
      orderId: order.id,
      keyId: env.RAZORPAY_KEY_ID,
      amount: AMOUNT_PAISE,
      currency: OFFER.currency,
      name: env.RAZORPAY_BRAND_NAME ?? BUSINESS.brand,
      description: OFFER.title,
      prefill: { name: lead.name, email: lead.email, contact: `+91${lead.phone}` },
      callbackUrl: `${env.SITE_URL}/api/razorpay/callback`,
    };
    if (recent.size > 5_000) recent.clear();
    recent.set(dedupeKey, { at: now, body: out });
    return json(out);
  } catch (err) {
    console.error("[orders] create failed", receipt, (err as Error).message);
    return fail(502, "Couldn't start the payment. Please try again.");
  }
}

/** Test hook. */
export function resetOrdersForTests() {
  recent.clear();
}
