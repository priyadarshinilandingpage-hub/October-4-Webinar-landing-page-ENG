import { z } from "zod";

// Server configuration: `.env` on the Node server (process.env), or `context.env` in the optional Cloudflare
// adapter. Validated once per env object; only key NAMES are ever logged, never values.
// - A missing or malformed REQUIRED key (Razorpay keys, SITE_URL) turns payments off (503) until it's fixed.
// - A malformed OPTIONAL key is ignored with a warning, so one typo (say, in the WhatsApp link) never stops sales.

/** Treats "" (a blank line copied from .env.example) the same as "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const httpsUrl = z.url().refine((u) => u.startsWith("https://"), "must be an https URL");

const schema = z.object({
  /** Razorpay Dashboard → Account & Settings → API Keys. rzp_test_… until go-live, then rzp_live_…. */
  RAZORPAY_KEY_ID: z.string().trim().regex(/^rzp_(test|live)_[A-Za-z0-9]{8,32}$/),
  RAZORPAY_KEY_SECRET: z.string().trim().min(10),
  /** Razorpay Dashboard → Webhooks → the secret you type when adding the webhook. */
  RAZORPAY_WEBHOOK_SECRET: optional(z.string().trim().min(8)),
  /** Name shown on the Razorpay checkout. */
  RAZORPAY_BRAND_NAME: optional(z.string().trim().min(2).max(40)),
  /** Public origin of this site, e.g. https://example.in. Payment redirects are built from it. */
  SITE_URL: z.url().transform((u) => new URL(u).origin),
  /** Buyers-only WhatsApp group. Revealed only after the server verifies the payment. */
  WEBINAR_WHATSAPP_URL: optional(httpsUrl),
  /** Firestore: the registrations table and the already-paid list (service-account key). */
  FIREBASE_PROJECT_ID: optional(z.string().regex(/^[a-z][a-z0-9-]{4,29}$/)),
  FIREBASE_CLIENT_EMAIL: optional(z.email()),
  FIREBASE_PRIVATE_KEY: optional(z.string().min(100)).transform((v) => v?.replace(/\\n/g, "\n")),
  /** Optional shared rate limiting (free Upstash Redis). */
  UPSTASH_REDIS_REST_URL: optional(httpsUrl),
  UPSTASH_REDIS_REST_TOKEN: optional(z.string().min(10)),
  /** Optional Meta Conversions API. */
  META_PIXEL_ID: optional(z.string().regex(/^\d{5,20}$/)),
  META_CAPI_TOKEN: optional(z.string().min(20)),
  META_TEST_EVENT_CODE: optional(z.string().regex(/^[A-Za-z0-9]{1,20}$/)),
  META_GRAPH_API_VERSION: optional(z.string().regex(/^v\d{2,3}\.\d$/)).transform((v) => v ?? "v24.0"),
});

/** `ignored`: optional keys that were set but malformed, so they are treated as not set. */
export type ServerEnv = z.infer<typeof schema> & { mode: "test" | "live"; ignored: string[] };
export type RawEnv = Record<string, unknown>;

const REQUIRED = new Set(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "SITE_URL"]);
const cache = new WeakMap<object, ServerEnv>();
const badKeys = (err: z.ZodError) => [...new Set(err.issues.map((i) => String(i.path[0] ?? "")))];

export function readEnv(raw: RawEnv): ServerEnv {
  const hit = cache.get(raw);
  if (hit) return hit;
  let parsed = schema.safeParse(raw);
  let ignored: string[] = [];
  if (!parsed.success) {
    const bad = badKeys(parsed.error);
    if (bad.some((k) => REQUIRED.has(k))) throw new Error(`Invalid server configuration: ${bad.join(", ")}`);
    ignored = bad;
    parsed = schema.safeParse(Object.fromEntries(Object.entries(raw).filter(([k]) => !ignored.includes(k))));
    if (!parsed.success) throw new Error(`Invalid server configuration: ${badKeys(parsed.error).join(", ")}`);
    console.warn(`[config] ignoring malformed optional settings (fix them in .env): ${ignored.join(", ")}`);
  }
  const mode = parsed.data.RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "live" : "test";
  if (mode === "live" && !parsed.data.SITE_URL.startsWith("https://")) {
    throw new Error("Invalid server configuration: SITE_URL must be https with live keys");
  }
  const env = { ...parsed.data, mode, ignored } as ServerEnv;
  cache.set(raw, env);
  return env;
}
