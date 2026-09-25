import "server-only";
import { z } from "zod";

// Server-only configuration. Validated once, lazily, so a missing key fails loudly on the server
// instead of silently sending payments to the wrong place. Values are never logged.

/** Treats "" (a blank line copied from .env.example) the same as "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const httpsUrl = z.url().refine((u) => u.startsWith("https://"), "must be an https URL");

const schema = z.object({
  CASHFREE_CLIENT_ID: z.string().trim().min(8),
  CASHFREE_CLIENT_SECRET: z.string().trim().min(8),
  CASHFREE_ENV: z.enum(["sandbox", "production"]),
  CASHFREE_API_VERSION: optional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform((v) => v ?? "2025-01-01"),
  /** Public origin of this site, e.g. https://example.in. Every redirect/notify URL is built from it. */
  SITE_URL: z.url().transform((u) => new URL(u).origin),
  /** Buyers-only WhatsApp group. Revealed only after the server verifies payment. */
  WEBINAR_WHATSAPP_URL: optional(httpsUrl),
  UPSTASH_REDIS_REST_URL: optional(httpsUrl),
  UPSTASH_REDIS_REST_TOKEN: optional(z.string().min(10)),
  /**
   * Firebase Firestore: the registrations table and the already-paid list. Active when the project id is set
   * and either a service-account key is given or the site runs on Google Cloud (Firebase App Hosting).
   */
  FIREBASE_PROJECT_ID: optional(z.string().regex(/^[a-z][a-z0-9-]{4,29}$/)),
  FIREBASE_CLIENT_EMAIL: optional(z.email()),
  /** The service account's private key (PEM). "\n" escapes, as most dashboards store it, are accepted. */
  FIREBASE_PRIVATE_KEY: optional(z.string().min(100)).transform((v) => v?.replace(/\\n/g, "\n")),
  /** Resend: the confirmation email with the WhatsApp link. Active when both are set. */
  RESEND_API_KEY: optional(z.string().regex(/^re_[A-Za-z0-9_]{10,}$/)),
  /** Sender on a domain verified in Resend, e.g. "Priyadharsini Webinar <webinar@yourdomain.in>". */
  EMAIL_FROM: optional(z.string().min(5).max(200)),
  EMAIL_REPLY_TO: optional(z.email()),
  /** Optional Meta Conversions API. Active only when both are set. */
  META_PIXEL_ID: optional(z.string().regex(/^\d{5,20}$/)),
  META_CAPI_TOKEN: optional(z.string().min(20)),
  META_TEST_EVENT_CODE: optional(z.string().regex(/^[A-Za-z0-9]{1,20}$/)),
  META_GRAPH_API_VERSION: optional(z.string().regex(/^v\d{2,3}\.\d$/)).transform((v) => v ?? "v24.0"),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Name the bad keys only, never their values.
    const keys = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Invalid server configuration: ${keys}`);
  }
  const e = parsed.data;
  if (e.CASHFREE_ENV === "production" && !e.SITE_URL.startsWith("https://")) {
    throw new Error("Invalid server configuration: SITE_URL must be https in production");
  }
  // Cashfree secrets are prefixed per environment; catch a test key in production (and vice versa).
  const secretEnv = /^cfsk_ma_(test|prod)_/.exec(e.CASHFREE_CLIENT_SECRET)?.[1];
  if ((secretEnv === "test" && e.CASHFREE_ENV === "production") || (secretEnv === "prod" && e.CASHFREE_ENV === "sandbox")) {
    throw new Error("Invalid server configuration: CASHFREE_CLIENT_SECRET does not match CASHFREE_ENV");
  }
  cached = e;
  return cached;
}
