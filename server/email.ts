import { calendarUrl, OFFER, startTimeLabel } from "../lib/offer";
import type { ServerEnv } from "./env";

// Seat-confirmation email through Resend's REST API (no SDK), sent once per paid order.
// Docs: https://resend.com/docs/api-reference/emails/send-email
// The Idempotency-Key makes Resend drop a repeat of the same order's email for 24 hours, so every path
// (callback, thank-you check, webhook) can ask for it without the buyer getting two.

export function emailEnabled(env: ServerEnv): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function confirmationEmail(input: { firstName?: string; orderId: string; whatsappUrl?: string; siteUrl: string }) {
  const when = `${OFFER.dateLabel}, ${startTimeLabel()}`;
  const hi = input.firstName ? `, ${input.firstName}` : "";
  const cal = calendarUrl();
  const subject = `Seat confirmed: ${OFFER.language} webinar on ${OFFER.dateLabel}, ${startTimeLabel()}`;

  const waHtml = input.whatsappUrl
    ? `<p style="margin:28px 0 10px;font-size:16px"><strong>Next step: join the WhatsApp group.</strong> The joining link and reminders are shared there.</p>
<a href="${escapeHtml(input.whatsappUrl)}" style="display:inline-block;background:#128C4A;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:12px">Join the WhatsApp group</a>`
    : `<p style="margin:28px 0 10px;font-size:16px">The joining link and reminders will come to your WhatsApp before the session.</p>`;

  const html = `<!doctype html><html><body style="margin:0;background:#ffffff">
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;color:#1E1530;line-height:1.5">
<p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#D9531E">Payment received</p>
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.25">Your seat is confirmed${escapeHtml(hi)}.</h1>
<p style="margin:0;font-size:16px">${escapeHtml(OFFER.title)}<br>with ${escapeHtml(OFFER.host)}, in ${escapeHtml(OFFER.language)}<br><strong>${escapeHtml(when)}</strong></p>
${waHtml}
<p style="margin:24px 0 0;font-size:15px"><a href="${escapeHtml(cal)}" style="color:#1E1530">Add it to Google Calendar</a></p>
<p style="margin:28px 0 0;font-size:13px;color:#5B5270">Amount paid: ₹${OFFER.priceInr}. Order reference: ${escapeHtml(input.orderId)}.<br>Questions? Reply to this email or visit <a href="${escapeHtml(input.siteUrl)}/contact" style="color:#5B5270">${escapeHtml(input.siteUrl.replace(/^https?:\/\//, ""))}/contact</a>.</p>
</div></body></html>`;

  const text = [
    `Your seat is confirmed${hi}.`,
    "",
    OFFER.title,
    `with ${OFFER.host}, in ${OFFER.language}`,
    when,
    "",
    input.whatsappUrl
      ? `Next step: join the WhatsApp group. The joining link and reminders are shared there.\n${input.whatsappUrl}`
      : "The joining link and reminders will come to your WhatsApp before the session.",
    "",
    `Add it to Google Calendar: ${cal}`,
    "",
    `Amount paid: ₹${OFFER.priceInr}. Order reference: ${input.orderId}.`,
    `Questions? Reply to this email or visit ${input.siteUrl}/contact`,
  ].join("\n");

  return { subject, html, text };
}

/** Sends the confirmation. "skipped" when Resend isn't configured. Throws on failure so callers can retry. */
export async function sendConfirmationEmail(env: ServerEnv, to: string, orderId: string, firstName?: string): Promise<"sent" | "skipped"> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return "skipped";
  const { subject, html, text } = confirmationEmail({ firstName, orderId, whatsappUrl: env.WEBINAR_WHATSAPP_URL, siteUrl: env.SITE_URL });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": `seat-confirmation/${orderId}`,
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text,
      ...(env.EMAIL_REPLY_TO && { reply_to: env.EMAIL_REPLY_TO }),
      tags: [{ name: "type", value: "seat_confirmation" }],
    }),
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Resend send failed: ${res.status}`); // status only: the body can echo the address
  return "sent";
}
