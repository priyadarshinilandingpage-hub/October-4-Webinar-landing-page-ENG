import { beforeEach, describe, expect, it } from "vitest";
import { rememberBuyer, resetBuyersForTests } from "@/server/buyers";
import { readEnv } from "@/server/env";
import { handleSeats } from "@/server/routes/seats";
import { ctx, SITE, testEnv } from "./helpers";

const get = (env: Record<string, unknown>) => handleSeats(ctx(new Request(`${SITE}/api/seats`), env));

beforeEach(() => resetBuyersForTests());

describe("GET /api/seats", () => {
  it("counts real paid orders, one per order (email and phone of one buyer count once)", async () => {
    const env = testEnv();
    expect(await (await get(env)).json()).toEqual({ enabled: true, booked: 0 });
    await rememberBuyer(readEnv(env), "order_AAA", { email: "a@example.com", phone: "9000000001" });
    await rememberBuyer(readEnv(env), "order_BBB", { phone: "9000000002" });
    expect(await (await get(env)).json()).toEqual({ enabled: true, booked: 2 });
    // The same buyer paying again is still one person.
    await rememberBuyer(readEnv(env), "order_CCC", { email: "a@example.com" });
    expect(await (await get(env)).json()).toEqual({ enabled: true, booked: 2 });
  });

  it("is off when the server isn't configured", async () => {
    expect(await (await get({})).json()).toEqual({ enabled: false });
  });
});
