import "server-only";
import { rememberBuyer } from "./buyers";
import type { CashfreeOrder } from "./cashfree";
import { emailEnabled, sendConfirmationEmail } from "./email";
import { env } from "./env";
import { createDoc, firestoreEnabled, getDoc, updateDoc, type FieldValue } from "./firestore";
import { OFFER, ORDER_AMOUNT } from "./offer";
import { normalizeIndianMobile } from "./validation";

// Everything that happens once, after the server has confirmed with Cashfree that an order is PAID:
// 1. remember the buyer (email + phone) so they can't pay twice,
// 2. add their row to the Firestore "registrations" table (one document per order, one field per column),
// 3. email the seat confirmation with the WhatsApp group link.
// Called by the webhook (the reliable path) and by the thank-you page (covers a late webhook, and localhost,
// which gets none). Every step is safe to repeat. A failed step throws, so the webhook answers 503 and
// Cashfree retries it later.

export const REGISTRATIONS = "registrations";

/** Orders this instance has fully handled: thank-you page reloads skip the work. */
const done = new Map<string, { duplicateOf?: string }>();
/** Without Firestore, emails already sent by this instance (Resend's idempotency key covers the rest). */
const emailed = new Set<string>();

function rowFor(order: CashfreeOrder, duplicateOf: string | undefined, emailSent: boolean): Record<string, FieldValue> {
  const c = order.customer_details ?? {};
  const t = order.order_tags ?? {};
  const phone = c.customer_phone ? normalizeIndianMobile(c.customer_phone) : null;
  return {
    order_id: order.order_id,
    name: c.customer_name?.trim() || t.short_name || null,
    email: c.customer_email?.trim().toLowerCase() || null,
    phone,
    amount: Number(ORDER_AMOUNT),
    currency: OFFER.currency,
    status: "PAID",
    mode: env().CASHFREE_ENV,
    webinar_date: OFFER.startsAtIso.slice(0, 10),
    confirmed_at: new Date(),
    marketing_consent: t.consent_marketing === "true",
    utm_source: t.utm_source || null,
    utm_campaign: t.utm_campaign || null,
    utm_content: t.utm_content || null,
    duplicate_of: duplicateOf ?? null,
    email_status: emailEnabled() ? (emailSent ? "sent" : "pending") : "off",
    email_sent_at: null,
  };
}

const firstNameOf = (order: CashfreeOrder) =>
  (order.customer_details?.customer_name || order.order_tags?.short_name || "").trim().split(/\s+/)[0] || undefined;

/**
 * The steps don't depend on each other: if Firestore is down or not set up yet, the buyer still gets the
 * email, and the other way round. Any failure is thrown at the end, after every step has been tried.
 */
export async function fulfilPaidOrder(order: CashfreeOrder): Promise<{ duplicateOf?: string }> {
  const cached = done.get(order.order_id);
  if (cached) return cached;

  const c = order.customer_details ?? {};
  const errors: Error[] = [];
  const attempt = async <T>(step: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await step();
    } catch (err) {
      errors.push(err as Error);
      return undefined;
    }
  };

  const duplicateOf = (await attempt(() => rememberBuyer(order.order_id, { email: c.customer_email, phone: c.customer_phone })))?.duplicateOf;

  let emailAlreadySent = emailed.has(order.order_id);
  let rowSaved = false;
  if (firestoreEnabled()) {
    await attempt(async () => {
      const created = await createDoc(REGISTRATIONS, order.order_id, rowFor(order, duplicateOf, emailAlreadySent));
      rowSaved = true;
      if (created === "exists" && emailEnabled()) {
        emailAlreadySent ||= (await getDoc(REGISTRATIONS, order.order_id))?.email_status === "sent";
      }
    });
  }

  if (emailEnabled() && !emailAlreadySent && c.customer_email) {
    const sent = await attempt(() => sendConfirmationEmail(c.customer_email!, order.order_id, firstNameOf(order)));
    if (sent) {
      if (emailed.size > 5_000) emailed.clear();
      emailed.add(order.order_id);
    }
    if (rowSaved) {
      const status: Record<string, FieldValue> = sent ? { email_status: "sent", email_sent_at: new Date() } : { email_status: "failed" };
      await attempt(() => updateDoc(REGISTRATIONS, order.order_id, status));
    }
  }

  if (errors.length) throw new Error(errors.map((e) => e.message).join("; "));
  const result = duplicateOf ? { duplicateOf } : {};
  if (done.size > 5_000) done.clear();
  done.set(order.order_id, result);
  return result;
}

/** Test hook: forget which orders this instance has handled. */
export function resetFulfilForTests() {
  done.clear();
  emailed.clear();
}
