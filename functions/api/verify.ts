// Cloudflare Pages Function: GET /api/verify?order_id=… (logic in server/routes/verify.ts).
import type { Ctx } from "../../server/http";
import { handleVerify } from "../../server/routes/verify";

export const onRequestGet = (ctx: Ctx) => handleVerify(ctx);
