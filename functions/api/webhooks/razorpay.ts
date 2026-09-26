// Cloudflare Pages Function: POST /api/webhooks/razorpay (logic in server/routes/webhook.ts).
import type { Ctx } from "../../../server/http";
import { handleWebhook } from "../../../server/routes/webhook";

export const onRequestPost = (ctx: Ctx) => handleWebhook(ctx);
