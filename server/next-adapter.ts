import { after } from "next/server";
import { setLocalStore } from "./buyers";
import type { Ctx } from "./http";
import { createFileStore, dataDir } from "./local-store";

// Without Firestore, the already-paid list is also kept in data/paid-contacts.json, so it survives restarts.
setLocalStore(createFileStore(dataDir()));

/**
 * Runs a server/routes handler inside a Next.js route handler: the settings come from process.env (Next loads
 * `.env` automatically) and background work (the post-payment follow-up) runs after the response is sent.
 */
export function run(handler: (ctx: Ctx) => Promise<Response>, request: Request): Promise<Response> {
  return handler({ request, env: process.env, waitUntil: (p) => after(p) });
}
