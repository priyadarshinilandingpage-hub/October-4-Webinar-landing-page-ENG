import { OFFER } from "../lib/offer";
import { normalizeIndianMobile } from "../lib/validation";
import { rememberBuyer } from "./buyers";
import { emailEnabled, sendConfirmationEmail } from "./email";
import type { ServerEnv } from "./env";
import { createDoc, firestoreEnabled, getDoc, updateDoc, type FieldValue } from "./firestore";
import type { PaidOrder } from "./order";

// Everything that happens once, after the server has confirmed with Razorpay that an order is PAID:
// 1. remember the buyer (email + phone) so they can't pay twice,
// 2. add their row to the Firestore "registrations" table (one document per order, one field per column),
// 3. email the seat confirmation with the WhatsApp group link.
// Called by the payment callback, the thank-you check and the webhook. Every step is safe to repeat, and the
// steps don't depend on each other (if Firestore is down, the email still goes). Failures are thrown at the end
// so the webhook answers 5xx and Razorpay retries.

export const REGISTRATIONS = "registrations";

/** Orders this instance has fully handled: repeat calls skip the work. */
const done = new Map<string, { duplicateOf?: string }>();
/** Emails already sent by this instance (Resend's idempotency key covers other instances). */
const emailed = new Set<string>();

function rowFor(env: ServerEnv, order: PaidOrder, duplicateOf: string | undefined, emailSent: boolean): Record<string, FieldValue> {
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
    email_status: emailEnabled(env) ? (emailSent ? "sent" : "pending") : "off",
    email_sent_at: null,
  };
}

export async function fulfilPaidOrder(env: ServerEnv, order: PaidOrder): Promise<{ duplicateOf?: string }> {
  const cached = done.get(order.id);
  if (cached) return cached;

  const c = order.customer;
  const errors: Error[] = [];
  const attempt = async <T>(step: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await step();
    } catch (err) {
      errors.push(err as Error);
      return undefined;
    }
  };

  const duplicateOf = (await attempt(() => rememberBuyer(env, order.id, { email: c.email, phone: c.phone })))?.duplicateOf;

  let emailAlreadySent = emailed.has(order.id);
  let rowSaved = false;
  if (firestoreEnabled(env)) {
    await attempt(async () => {
      const created = await createDoc(env, REGISTRATIONS, order.id, rowFor(env, order, duplicateOf, emailAlreadySent));
      rowSaved = true;
      if (created === "exists" && emailEnabled(env)) {
        emailAlreadySent ||= (await getDoc(env, REGISTRATIONS, order.id))?.email_status === "sent";
      }
    });
  }

  if (emailEnabled(env) && !emailAlreadySent && c.email) {
    const firstName = c.name?.trim().split(/\s+/)[0] || undefined;
    const sent = await attempt(() => sendConfirmationEmail(env, c.email!, order.id, firstName));
    if (sent) {
      if (emailed.size > 5_000) emailed.clear();
      emailed.add(order.id);
    }
    if (rowSaved) {
      const status: Record<string, FieldValue> = sent ? { email_status: "sent", email_sent_at: new Date() } : { email_status: "failed" };
      await attempt(() => updateDoc(env, REGISTRATIONS, order.id, status));
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
  emailed.clear();
}
