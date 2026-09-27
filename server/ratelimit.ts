import type { ServerEnv } from "./env";

// Per-IP limits for the payment endpoints. With Upstash configured, counts are shared by every server process
// (fixed window, INCR + EXPIRE over the REST API). Without it, each process counts on its own, which still stops
// a single script hammering the site. Fails open: a limiter problem never blocks buyers.

export type Bucket = "order" | "verify";

const LIMITS: Record<Bucket, { limit: number; windowS: number }> = {
  order: { limit: 10, windowS: 600 }, // order creation: 10 per 10 minutes
  verify: { limit: 30, windowS: 60 }, // thank-you page checks: 30 per minute
};

const memory = new Map<string, { count: number; resetAt: number }>();

/**
 * No real visitor address: the request came through a proxy (nginx) that didn't pass it on, so every buyer
 * would share one address and hit the limit together. Such requests are not limited (a warning is logged once).
 */
const NO_VISITOR_IP = /^(unknown|::1|(::ffff:)?(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|f[cd][0-9a-f]{2}:|fe80:)/i;
let warned = false;

function memoryAllow(key: string, limit: number, windowS: number, now: number): boolean {
  const cur = memory.get(key);
  if (!cur || cur.resetAt <= now) {
    if (memory.size > 10_000) memory.clear();
    memory.set(key, { count: 1, resetAt: now + windowS * 1000 });
    return true;
  }
  cur.count++;
  return cur.count <= limit;
}

async function upstashAllow(env: ServerEnv, key: string, limit: number, windowS: number): Promise<boolean> {
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "content-type": "application/json" },
    // Start the window (with its expiry) only if it doesn't exist yet, then count this request.
    body: JSON.stringify([
      ["SET", key, "0", "EX", String(windowS), "NX"],
      ["INCR", key],
    ]),
    signal: AbortSignal.timeout(2_000),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const [, incr] = (await res.json()) as { result?: number }[];
  return (incr?.result ?? 0) <= limit;
}

/** True if this IP may proceed. */
export async function allow(env: ServerEnv, bucket: Bucket, ip: string, now = Date.now()): Promise<boolean> {
  if (NO_VISITOR_IP.test(ip)) {
    if (!warned) {
      warned = true;
      console.warn("[ratelimit] visitor address missing, limits are off. In nginx add: proxy_set_header X-Real-IP $remote_addr;");
    }
    return true;
  }
  const { limit, windowS } = LIMITS[bucket];
  const key = `rl:${bucket}:${ip}`;
  try {
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) return await upstashAllow(env, key, limit, windowS);
    return memoryAllow(key, limit, windowS, now);
  } catch (err) {
    console.error(`[ratelimit] ${bucket} limiter error`, (err as Error).message);
    return true;
  }
}

/** Test hook. */
export function resetRateLimitForTests() {
  memory.clear();
}
