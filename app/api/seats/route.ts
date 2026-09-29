// GET /api/seats: real seats left (logic in server/routes/seats.ts).
import { run } from "@/server/next-adapter";
import { handleSeats } from "@/server/routes/seats";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return run(handleSeats, request);
}
