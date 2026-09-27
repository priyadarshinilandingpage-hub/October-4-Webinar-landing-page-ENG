// /api/razorpay/callback: where Razorpay's checkout returns the buyer (logic in server/routes/callback.ts).
import { run } from "@/server/next-adapter";
import { handleCallback } from "@/server/routes/callback";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return run(handleCallback, request);
}

export function GET(request: Request) {
  return run(handleCallback, request);
}
