// POST /api/orders: creates the fixed-price Razorpay order (logic in server/routes/orders.ts).
import { run } from "@/server/next-adapter";
import { handleCreateOrder } from "@/server/routes/orders";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return run(handleCreateOrder, request);
}
