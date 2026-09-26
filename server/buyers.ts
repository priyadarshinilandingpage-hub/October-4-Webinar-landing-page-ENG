import { OFFER } from "../lib/offer";
import { normalizeIndianMobile } from "../lib/validation";
import { sha256Hex } from "./crypto";
import type { ServerEnv } from "./env";
import { createDoc, firestoreEnabled, getDoc, getDocs } from "./firestore";

// Who has already paid for this session, so the same person can't pay twice.
// - Matched on email OR WhatsApp number. Never on name alone: many people share a name.
// - One Firestore document per email and per phone (collection "paid_contacts"), named by a hash, so no email
//   or phone number ever appears in a document path or URL. Each holds the first paid order id. Created with
//   create-only writes: if two payments race, the first one stays on record.
// - Ids include the Razorpay mode and the session date: test payments never block real buyers, and a new
//   webinar date starts with a clean list.
// - Without Firestore (tests, local runs) each server instance keeps the list in memory.

export const PAID_CONTACTS = "paid_contacts";
const MEMORY_MAX = 100_000;

export interface Contact {
  email?: string | null;
  phone?: string | null;
}

const memory = new Map<string, string>();

async function idsFor(env: ServerEnv, contact: Contact): Promise<string[]> {
  const prefix = `${env.mode}_${OFFER.startsAtIso.slice(0, 10).replace(/-/g, "")}`;
  const id = async (kind: string, value: string) => `${prefix}_${kind}_${(await sha256Hex(`webinar-buyer:${kind}:${value}`)).slice(0, 40)}`;
  const ids: string[] = [];
  const email = contact.email?.trim().toLowerCase();
  if (email && email.includes("@")) ids.push(await id("email", email));
  const phone = contact.phone ? normalizeIndianMobile(contact.phone) : "";
  if (/^[6-9]\d{9}$/.test(phone)) ids.push(await id("phone", phone));
  return ids;
}

async function claim(env: ServerEnv, id: string, orderId: string): Promise<string> {
  if (!firestoreEnabled(env)) {
    const cur = memory.get(id);
    if (cur) return cur;
    if (memory.size < MEMORY_MAX) memory.set(id, orderId);
    return orderId;
  }
  const kind = id.includes("_email_") ? "email" : "phone";
  if ((await createDoc(env, PAID_CONTACTS, id, { order_id: orderId, kind, created_at: new Date() })) === "created") return orderId;
  const held = (await getDoc(env, PAID_CONTACTS, id))?.order_id;
  return typeof held === "string" && held ? held : orderId;
}

/** The order id this email or phone already paid with, or null. Fails open (null) if the store is down. */
export async function findPaidOrder(env: ServerEnv, contact: Contact): Promise<string | null> {
  const ids = await idsFor(env, contact);
  if (ids.length === 0) return null;
  try {
    if (!firestoreEnabled(env)) {
      for (const id of ids) if (memory.get(id)) return memory.get(id)!;
      return null;
    }
    const docs = await getDocs(env, PAID_CONTACTS, ids);
    for (const id of ids) {
      const v = docs.get(id)?.order_id;
      if (typeof v === "string" && v) return v;
    }
    return null;
  } catch (err) {
    console.error("[buyers] lookup failed", (err as Error).message);
    return null;
  }
}

/**
 * Remembers a verified PAID order's buyer. Safe to repeat. Throws if the store fails.
 * `duplicateOf` is set when this email or phone had already paid with a different order.
 */
export async function rememberBuyer(env: ServerEnv, orderId: string, contact: Contact): Promise<{ duplicateOf?: string }> {
  const held = await Promise.all((await idsFor(env, contact)).map((id) => claim(env, id, orderId)));
  const duplicateOf = held.find((id) => id !== orderId);
  if (duplicateOf) console.warn("[buyers] second paid order for the same buyer", orderId, "first:", duplicateOf);
  return duplicateOf ? { duplicateOf } : {};
}

/** Test hook. */
export function resetBuyersForTests() {
  memory.clear();
}
