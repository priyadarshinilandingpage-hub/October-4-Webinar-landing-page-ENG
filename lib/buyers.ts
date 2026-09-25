import "server-only";
import { createHash } from "node:crypto";
import { env } from "./env";
import { createDoc, firestoreEnabled, getDoc, getDocs } from "./firestore";
import { OFFER } from "./offer";
import { normalizeIndianMobile } from "./validation";

// Who has already paid for this session, so the same person can't pay twice.
// - Matched on email OR WhatsApp number. Never on name alone: many people share a name.
// - One Firestore document per email and per phone (collection "paid_contacts"), named by a hash, so
//   no email or phone number ever appears in a document path or URL. Each holds the first paid order id.
//   Created with create-only writes: if two payments race, the first one stays on record.
// - Ids include the Cashfree mode and the session date: sandbox test payments never block real buyers,
//   and a new webinar date starts with a clean list.
// - Without Firestore (local development) each server instance keeps the list in memory until restart.

export const PAID_CONTACTS = "paid_contacts";
const MEMORY_MAX = 100_000;

export interface Contact {
  email?: string | null;
  phone?: string | null;
}

interface Store {
  /** Order id stored under the first id that has one. */
  find(ids: string[]): Promise<string | null>;
  /** Stores orderId under id if the id is free. Returns the order id that id now holds. */
  claim(id: string, orderId: string): Promise<string>;
}

function memoryStore(): Store {
  const map = new Map<string, string>();
  return {
    async find(ids) {
      for (const id of ids) {
        const v = map.get(id);
        if (v) return v;
      }
      return null;
    },
    async claim(id, orderId) {
      const cur = map.get(id);
      if (cur) return cur;
      if (map.size < MEMORY_MAX) map.set(id, orderId); // never evicts: forgetting a buyer would allow a repeat
      return orderId;
    },
  };
}

const firestoreStore: Store = {
  async find(ids) {
    const docs = await getDocs(PAID_CONTACTS, ids);
    for (const id of ids) {
      const v = docs.get(id)?.order_id;
      if (typeof v === "string" && v) return v;
    }
    return null;
  },
  async claim(id, orderId) {
    const kind = id.includes("_email_") ? "email" : "phone";
    if ((await createDoc(PAID_CONTACTS, id, { order_id: orderId, kind, created_at: new Date() })) === "created") return orderId;
    const held = (await getDoc(PAID_CONTACTS, id))?.order_id;
    return typeof held === "string" && held ? held : orderId;
  },
};

let memory: Store | undefined;

function getStore(): Store {
  if (firestoreEnabled()) return firestoreStore;
  if (!memory) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[buyers] Firestore not configured: the already-paid check only covers this server instance");
    }
    memory = memoryStore();
  }
  return memory;
}

/** Document ids for a contact: one for the email, one for the phone (whichever is usable). */
function idsFor(contact: Contact): string[] {
  const prefix = `${env().CASHFREE_ENV}_${OFFER.startsAtIso.slice(0, 10).replace(/-/g, "")}`;
  const hash = (kind: string, value: string) =>
    `${prefix}_${kind}_${createHash("sha256").update(`webinar-buyer:${kind}:${value}`).digest("hex").slice(0, 40)}`;

  const ids: string[] = [];
  const email = contact.email?.trim().toLowerCase();
  if (email && email.includes("@")) ids.push(hash("email", email));
  const phone = contact.phone ? normalizeIndianMobile(contact.phone) : "";
  if (/^[6-9]\d{9}$/.test(phone)) ids.push(hash("phone", phone));
  return ids;
}

/**
 * The order id this email or phone already paid with, or null. Fails open (null) if the store is down,
 * so an outage never blocks a first-time buyer.
 */
export async function findPaidOrder(contact: Contact): Promise<string | null> {
  const ids = idsFor(contact);
  if (ids.length === 0) return null;
  try {
    return await getStore().find(ids);
  } catch (err) {
    console.error("[buyers] lookup failed", (err as Error).message);
    return null;
  }
}

/**
 * Remembers a verified PAID order's buyer. Safe to call many times for the same order. Throws if the
 * store fails (the webhook then asks Cashfree to retry).
 * `duplicateOf` is set when this email or phone had already paid with a different order (two checkouts
 * paid in parallel): that order id is logged so the extra payment can be refunded.
 */
export async function rememberBuyer(orderId: string, contact: Contact): Promise<{ duplicateOf?: string }> {
  const store = getStore();
  const held = await Promise.all(idsFor(contact).map((id) => store.claim(id, orderId)));
  const duplicateOf = held.find((id) => id !== orderId);
  if (duplicateOf) console.warn("[buyers] second paid order for the same buyer", orderId, "first:", duplicateOf);
  return duplicateOf ? { duplicateOf } : {};
}

/** Test hook: forget everything (memory store only). */
export function resetBuyersForTests() {
  memory = undefined;
}
