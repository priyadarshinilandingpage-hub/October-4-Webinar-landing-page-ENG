import { countPaidOrders } from "../buyers";
import { readEnv } from "../env";
import { json, type Ctx } from "../http";

// GET /api/seats: how many people have really booked (distinct paid orders for this session), for the page's
// "N people have booked" line. The page hides it below a minimum, and never shows a made-up number.

export async function handleSeats({ env: envRaw }: Ctx): Promise<Response> {
  try {
    const paid = countPaidOrders(readEnv(envRaw));
    return paid === null ? json({ enabled: false }) : json({ enabled: true, booked: paid });
  } catch {
    return json({ enabled: false });
  }
}
