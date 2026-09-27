import { OFFER } from "../lib/offer";
import { normalizeIndianMobile } from "../lib/validation";
import { rememberBuyer } from "./buyers";
import type { ServerEnv } from "./env";
import { createDoc, firestoreEnabled, type FieldValue } from "./firestore";
import type { PaidOrder } from "./order";

// Everything that happens once, after the server has confirmed with Razorpay that an order is PAID:
// 1. remember the buyer (email + phone) so they can't pay twice,
// 2. add their row to the Firestore "registrations" table (one document per order, one field per column).
// The buyer gets the WhatsApp group link on the verified thank-you page (no confirmation email is sent).
// Called by the payment callback, the thank-you check and the webhook. Both steps are safe to repeat and
// independent; failures are thrown at the end so the webhook answers 5xx and Razorpay retries.

export const REGISTRATIONS = "registrations";

/** Orders this instance has fully handled: repeat calls skip the work. */
const done = new Map<string, { duplicateOf?: string }>();

function rowFor(env: ServerEnv, order: PaidOrder, duplicateOf: string | undefined): Record<string, FieldValue> {
  const c = order.customer;
  const t = order.notes;
  return {
    order_id: order.id,
    name: c.name?.trim() || null,
    email: c.email?.trim().toLowerCase() || null,
    phone: c.phone ? normalizeIndianMobile(c.phone) : null,
    amount: order.amountPaise / 100,
    currency: order.currency,
    status: "PAID",
    mode: env.mode,
    webinar_date: OFFER.startsAtIso.slice(0, 10),
    confirmed_at: new Date(),
    marketing_consent: t.consent_marketing === "true",
    utm_source: t.utm_source || null,
    utm_campaign: t.utm_campaign || null,
    utm_content: t.utm_content || null,
    duplicate_of: duplicateOf ?? null,
  };
}

export async function fulfilPaidOrder(env: ServerEnv, order: PaidOrder): Promise<{ duplicateOf?: string }> {
  const cached = done.get(order.id);
  if (cached) return cached;

  const c = order.customer;
  const errors: Error[] = [];
  let duplicateOf: string | undefined;
  try {
    duplicateOf = (await rememberBuyer(env, order.id, { email: c.email, phone: c.phone })).duplicateOf;
  } catch (err) {
    errors.push(err as Error);
  }
  if (firestoreEnabled(env)) {
    try {
      await createDoc(env, REGISTRATIONS, order.id, rowFor(env, order, duplicateOf)); // "exists" on repeats: fine
    } catch (err) {
      errors.push(err as Error);
    }
  }

  if (errors.length) throw new Error(errors.map((e) => e.message).join("; "));
  const result = duplicateOf ? { duplicateOf } : {};
  if (done.size > 5_000) done.clear();
  done.set(order.id, result);
  return result;
}

/** Test hook. */
export function resetFulfilForTests() {
  done.clear();
}
