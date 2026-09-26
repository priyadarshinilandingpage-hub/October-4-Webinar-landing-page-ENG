// Cloudflare Pages Function: GET /api/health, for uptime monitors. Deliberately says nothing about configuration.
import { json } from "../../server/http";

export const onRequestGet = () => json({ ok: true });
