// GET /api/health: for uptime monitors. Deliberately says nothing about configuration.
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ ok: true });
}
