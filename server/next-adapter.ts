import { after } from "next/server";
import type { Ctx } from "./http";

/**
 * Runs a server/routes handler inside a Next.js route handler: the settings come from process.env (Next loads
 * `.env` automatically) and background work (the post-payment follow-up) runs after the response is sent.
 */
export function run(handler: (ctx: Ctx) => Promise<Response>, request: Request): Promise<Response> {
  return handler({ request, env: process.env, waitUntil: (p) => after(p) });
}
