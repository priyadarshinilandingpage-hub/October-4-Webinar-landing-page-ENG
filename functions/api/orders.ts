// Cloudflare Pages Function: POST /api/orders (logic in server/routes/orders.ts).
import type { Ctx } from "../../server/http";
import { handleCreateOrder } from "../../server/routes/orders";

export const onRequestPost = (ctx: Ctx) => handleCreateOrder(ctx);
