// GET /api/verify?order_id=…: the thank-you page's check (logic in server/routes/verify.ts).
import { run } from "@/server/next-adapter";
import { handleVerify } from "@/server/routes/verify";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return run(handleVerify, request);
}
