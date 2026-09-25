import type { Metadata } from "next";
import { headers } from "next/headers";
import { Chat } from "@/components/icons";
import { PixelEvent } from "@/components/MetaPixel";
import { verifyOrder, type VerifiedStatus } from "@/lib/cashfree";
import { emailEnabled } from "@/lib/email";
import { env } from "@/lib/env";
import { fulfilPaidOrder } from "@/lib/fulfil";
import { calendarUrl, OFFER, startTimeLabel } from "@/lib/offer";
import { allow, clientIp } from "@/lib/ratelimit";

export const metadata: Metadata = {
  title: "Your seat · Webinar",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ order_id?: string | string[] }> };

const btn = "inline-flex items-center justify-center rounded-2xl px-6 py-4 font-semibold transition-opacity hover:opacity-90";

// The URL only says WHICH order to check. Whether it's paid comes from Cashfree, on the server.
export default async function ThankYou({ searchParams }: Props) {
  const { order_id } = await searchParams;
  const orderId = typeof order_id === "string" ? order_id : "";

  let status: VerifiedStatus = "not_found";
  let firstName: string | undefined;
  let paidTwice = false;
  if (orderId) {
    if (await allow("verify", clientIp(await headers()))) {
      try {
        const v = await verifyOrder(orderId);
        ({ status, firstName } = v);
        // Also done by the webhook; doing it here too covers a late webhook (and localhost, which gets none).
        // A failure here never hides the confirmation: Cashfree said PAID, and the webhook retries the rest.
        if (v.order) {
          try {
            paidTwice = Boolean((await fulfilPaidOrder(v.order)).duplicateOf);
          } catch (err) {
            console.error("[thank-you] follow-up failed", orderId, (err as Error).message);
          }
        }
      } catch (err) {
        console.error("[thank-you] verify failed", (err as Error).message);
        status = "pending";
      }
    } else {
      status = "pending";
    }
  }

  let whatsapp: string | undefined;
  let emailOn = false;
  if (status === "paid") {
    try {
      whatsapp = env().WEBINAR_WHATSAPP_URL;
      emailOn = emailEnabled();
    } catch {}
  }

  return (
    <main className="min-h-screen bg-white text-[#1E1530]">
      {/* Payment still confirming: re-check automatically. */}
      {status === "pending" && <meta httpEquiv="refresh" content="5" />}
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
        {status === "paid" && (
          <>
            {/* Browser half of the Purchase event; the webhook sends the server half with the same id. */}
            <PixelEvent event="Purchase" eventId={orderId} value={OFFER.priceInr} />
            <p className="text-sm font-semibold uppercase tracking-wider text-[#D9531E]">Payment received · ₹{OFFER.priceInr}</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              Your seat is confirmed{firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="mt-5 text-lg text-[#5B5270]">
              See you live on{" "}
              <strong className="text-[#1E1530]">
                {OFFER.dateLabel}, {startTimeLabel()}
              </strong>
              , in {OFFER.language}.
              {!whatsapp && " The joining link and reminders will come to your email and WhatsApp."}
            </p>
            {whatsapp && (
              <section aria-labelledby="wa-step" className="mt-8 rounded-3xl border-2 border-[#128C4A]/30 bg-[#128C4A]/[0.06] p-5 sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#128C4A]">Last step</p>
                <h2 id="wa-step" className="mt-1 text-2xl font-semibold leading-snug">
                  Join the WhatsApp group now
                </h2>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-[#5B5270]">
                  <li>Tap the green button below.</li>
                  <li>
                    WhatsApp opens. Tap <strong className="text-[#1E1530]">Join group</strong>.
                  </li>
                  <li>The joining link and reminders are shared in this group.</li>
                </ol>
                <a
                  href={whatsapp}
                  rel="noopener noreferrer"
                  target="_blank"
                  className={`${btn} mt-5 w-full gap-2 bg-[#128C4A] text-lg text-white`}
                >
                  <Chat className="size-5" />
                  Join the WhatsApp group
                </a>
                {emailOn && <p className="mt-3 text-sm text-[#5B5270]">A copy of this link is also on its way to your email.</p>}
              </section>
            )}
            {paidTwice && (
              <p className="mt-5 rounded-2xl border border-[#D9531E]/30 bg-[#D9531E]/5 px-5 py-4 text-[#1E1530]">
                This email or WhatsApp number had already paid once, so this is a second payment for the same seat.{" "}
                <a className="font-semibold underline" href="/contact">
                  Contact us
                </a>{" "}
                with this page&apos;s link.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={calendarUrl()}
                rel="noopener noreferrer"
                target="_blank"
                className={`${btn} border border-[#1E1530]/15 text-[#1E1530]`}
              >
                Add to Google Calendar
              </a>
            </div>
            <p className="mt-10 text-sm text-[#5B5270]">
              Keep this page&apos;s link private. Questions? See the <a className="underline" href="/contact">contact page</a>.
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">Confirming your payment…</h1>
            <p className="mt-5 text-lg text-[#5B5270]">
              Your bank is still confirming this payment. This page checks again every few seconds. If money was
              debited, your seat is safe and we&apos;ll confirm on email and WhatsApp.
            </p>
            <a href="" className={`${btn} mt-10 bg-[#1E1530] text-white`}>
              Check again
            </a>
          </>
        )}

        {(status === "unpaid" || status === "failed" || status === "not_found") && (
          <>
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">Payment not completed</h1>
            <p className="mt-5 text-lg text-[#5B5270]">
              No seat was booked. If any amount was debited, it is returned to your account automatically by your
              bank, usually within 5 to 7 working days. You can try again below.
            </p>
            <a href="/#join" className={`${btn} mt-10 bg-[#D9531E] text-white`}>
              Try again · ₹{OFFER.priceInr}
            </a>
            <p className="mt-10 text-sm text-[#5B5270]">
              Paid but seeing this? <a className="underline" href="/contact">Contact us</a> with your payment reference.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
