import "server-only";

/**
 * Reads a request body into memory, but never more than `maxBytes`.
 * Returns null when the body is too large (checked against Content-Length first, then while streaming),
 * so an attacker can't make the server buffer a huge payload.
 */
export async function readBodyLimited(req: Request, maxBytes: number): Promise<Buffer | null> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!req.body) return Buffer.alloc(0);

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
  return Buffer.concat(chunks);
}

const NO_STORE = { "cache-control": "no-store" } as const;

/** JSON response that is never cached. */
export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

/** Generic error for the browser. Details belong in server logs, never in the response. */
export function fail(status: number, error: string, field?: string): Response {
  return json(field ? { error, field } : { error }, status);
}
