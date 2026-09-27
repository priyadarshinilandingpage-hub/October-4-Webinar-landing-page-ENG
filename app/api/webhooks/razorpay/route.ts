// POST /api/webhooks/razorpay: Razorpay's signed server notice (logic in server/routes/webhook.ts).
import { run } from "@/server/next-adapter";
import { handleWebhook } from "@/server/routes/webhook";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return run(handleWebhook, request);
}
