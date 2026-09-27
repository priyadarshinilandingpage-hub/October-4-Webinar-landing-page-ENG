// Small helpers shared by the Pages Functions. Web-standard APIs only (runs on Cloudflare and in Node tests).

/** What Cloudflare hands every Pages Function. Only the parts we use. */
export interface Ctx {
  request: Request;
  env: Record<string, unknown>;
  waitUntil: (promise: Promise<unknown>) => void;
}

const BASE_HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "x-robots-tag": "noindex",
} as const;

/** JSON response that is never cached. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, "content-type": "application/json; charset=utf-8" } });
}

/** Generic error for the browser. Details belong in server logs, never in the response. */
export function fail(status: number, error: string, field?: string): Response {
  return json(field ? { error, field } : { error }, status);
}

export function empty(status: number): Response {
  return new Response(null, { status, headers: BASE_HEADERS });
}

/** 303 redirect to a URL we built ourselves (never one taken from the request). */
export function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { ...BASE_HEADERS, location } });
}

/**
 * Reads a request body, but never more than `maxBytes` (checked against Content-Length first, then while
 * streaming), so nobody can make the function buffer a huge payload. Null when too large.
 */
export async function readBodyLimited(req: Request, maxBytes: number): Promise<Uint8Array | null> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

/**
 * Best-effort client IP for rate limiting. Behind Cloudflare: cf-connecting-ip. Behind nginx or another reverse
 * proxy: x-real-ip, else the first x-forwarded-for entry (set `proxy_set_header X-Real-IP $remote_addr;`).
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip")?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
