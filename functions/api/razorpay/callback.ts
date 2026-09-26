// Cloudflare Pages Function: /api/razorpay/callback, where Razorpay's checkout returns the buyer
// (logic in server/routes/callback.ts).
import type { Ctx } from "../../../server/http";
import { handleCallback } from "../../../server/routes/callback";

export const onRequestPost = (ctx: Ctx) => handleCallback(ctx);
export const onRequestGet = (ctx: Ctx) => handleCallback(ctx);
