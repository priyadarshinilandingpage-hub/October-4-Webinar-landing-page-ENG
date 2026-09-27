import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findPaidOrder, rememberBuyer, resetBuyersForTests, setLocalStore } from "@/server/buyers";
import { readEnv } from "@/server/env";
import { createFileStore } from "@/server/local-store";
import { ORDER_ID, OTHER_ORDER, testEnv } from "./helpers";

// The already-paid list on a Node server without Firestore: data/paid-contacts.json.

const dirs: string[] = [];
function tempDir() {
  const d = mkdtempSync(path.join(tmpdir(), "webinar-store-"));
  dirs.push(d);
  return d;
}

afterEach(() => {
  resetBuyersForTests();
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("already-paid list saved in a file (no Firestore)", () => {
  it("survives a server restart; holds no emails or phone numbers", async () => {
    const env = readEnv(testEnv());
    const dir = tempDir();
    setLocalStore(createFileStore(dir));
    await rememberBuyer(env, ORDER_ID, { email: "priya@example.com", phone: "9876543210" });

    resetBuyersForTests(true); // restart: memory is gone, the file stays
    expect(await findPaidOrder(env, { email: "PRIYA@example.com" })).toBe(ORDER_ID);
    expect(await findPaidOrder(env, { phone: "+91 98765 43210" })).toBe(ORDER_ID);
    expect(await findPaidOrder(env, { email: "someone.else@example.com", phone: "9123456780" })).toBeNull();

    const text = readFileSync(path.join(dir, "paid-contacts.json"), "utf8");
    expect(text).not.toMatch(/priya|example|9876543210/i);
  });

  it("after a restart, a second payment by the same buyer is flagged as a duplicate of the first", async () => {
    const env = readEnv(testEnv());
    setLocalStore(createFileStore(tempDir()));
    await rememberBuyer(env, ORDER_ID, { email: "priya@example.com" });
    resetBuyersForTests(true);
    expect(await rememberBuyer(env, OTHER_ORDER, { email: "priya@example.com" })).toEqual({ duplicateOf: ORDER_ID });
  });

  it("an unreadable file is moved aside, never overwritten", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const env = readEnv(testEnv());
    const dir = tempDir();
    writeFileSync(path.join(dir, "paid-contacts.json"), "{broken");
    setLocalStore(createFileStore(dir));
    expect(await findPaidOrder(env, { email: "priya@example.com" })).toBeNull();
    expect(readdirSync(dir).some((f) => f.startsWith("paid-contacts.json.unreadable-"))).toBe(true);
    expect(err).toHaveBeenCalled();
  });

  it("a folder it can't write to never breaks the payment follow-up", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const env = readEnv(testEnv());
    const notADir = path.join(tempDir(), "file");
    writeFileSync(notADir, "x");
    setLocalStore(createFileStore(notADir));
    await expect(rememberBuyer(env, ORDER_ID, { email: "priya@example.com" })).resolves.toEqual({});
    expect(await findPaidOrder(env, { email: "priya@example.com" })).toBe(ORDER_ID); // still known until restart
    expect(err).toHaveBeenCalled();
  });
});
