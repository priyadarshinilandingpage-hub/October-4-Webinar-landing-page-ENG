// Liveness check for Render / uptime monitors. Deliberately says nothing about configuration.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
