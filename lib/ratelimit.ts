import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";

// Upstash (shared across instances) when configured; otherwise a per-instance in-memory window.
// The in-memory fallback is weaker on serverless (each instance counts separately): set UPSTASH_* in production.

type Bucket = "order" | "verify";

/** Limits per client IP. Generous enough for families/offices sharing one IP, tight enough to stop scripts. */
const LIMITS: Record<Bucket, { limit: number; windowMs: number; window: `${number} m` }> = {
  order: { limit: 10, windowMs: 10 * 60_000, window: "10 m" }, // order creation
  verify: { limit: 30, windowMs: 60_000, window: "1 m" }, // thank-you page status checks
};

type Limiter = (key: string) => Promise<boolean>;
const limiters = new Map<Bucket, Limiter>();

function memoryLimiter(limit: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();
  return async (key) => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    if (hits.size > 10_000) hits.clear(); // bound memory
    hits.set(key, recent);
    return recent.length <= limit;
  };
}

function limiterFor(bucket: Bucket): Limiter {
  let l = limiters.get(bucket);
  if (l) return l;
  const { limit, windowMs, window } = LIMITS[bucket];
  const e = env();
  if (e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN) {
    const rl = new Ratelimit({
      redis: new Redis({ url: e.UPSTASH_REDIS_REST_URL, token: e.UPSTASH_REDIS_REST_TOKEN, enableTelemetry: false }),
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${bucket}`,
      analytics: false,
      timeout: 2_000, // if Redis is slow, let the request through rather than block buyers
    });
    l = async (key) => (await rl.limit(key)).success;
  } else {
    l = memoryLimiter(limit, windowMs);
  }
  limiters.set(bucket, l);
  return l;
}

/** True if this IP may proceed. Fails open (logs, allows) if the limiter itself errors. */
export async function allow(bucket: Bucket, ip: string): Promise<boolean> {
  try {
    return await limiterFor(bucket)(ip);
  } catch (err) {
    console.error(`[ratelimit] ${bucket} limiter error`, (err as Error).name);
    return true;
  }
}

/**
 * Best-effort client IP, per platform, using only headers the platform itself controls:
 * - Vercel overwrites x-real-ip / x-forwarded-for with the real client IP.
 * - Render sets the first x-forwarded-for entry to the real client IP.
 * - Firebase App Hosting / Cloud Run: Google's load balancer APPENDS "<client>, <lb>", so earlier
 *   entries can be spoofed; the second-to-last entry is the one Google saw.
 */
export function clientIp(headers: Headers): string {
  if (process.env.VERCEL) return headers.get("x-real-ip")?.trim() || "unknown";
  const xff = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (process.env.K_SERVICE && xff.length >= 2) return xff[xff.length - 2]!;
  return xff[0] || headers.get("x-real-ip")?.trim() || "unknown";
}
