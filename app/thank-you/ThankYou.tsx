"use client";

import { useEffect, useState } from "react";
import { Chat } from "@/components/icons";
import { PixelEvent } from "@/components/MetaPixel";
import { calendarUrl, OFFER, startTimeLabel } from "@/lib/offer";

type Result =
  | { status: "loading" | "pending" | "unpaid" | "failed" | "not_found" }
  | { status: "paid"; firstName?: string; whatsapp?: string; emailOn?: boolean; duplicate?: boolean };

const btn = "inline-flex items-center justify-center rounded-2xl px-6 py-4 font-semibold transition-opacity hover:opacity-90";
const ORDER_ID_RE = /^order_[A-Za-z0-9]{14}$/;
const POLL_MS = 4_000;
const MAX_POLLS = 45; // about 3 minutes of "bank still confirming"

/**
 * The address only says WHICH order to check. Whether it's paid comes from the server (GET /api/verify), which
 * asks Razorpay; the WhatsApp group link arrives only with a verified PAID answer.
 */
export function ThankYou() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<Result>({ status: "loading" });

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("order_id") ?? "";
    setOrderId(id);
    if (!ORDER_ID_RE.test(id)) {
      setResult({ status: "not_found" });
      return;
    }
    let polls = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const check = async () => {
      let next: Result = { status: "pending" };
      try {
        const res = await fetch(`/api/verify?order_id=${encodeURIComponent(id)}`, { cache: "no-store" });
        if (res.ok) next = (await res.json()) as Result;
      } catch {}
      if (stopped) return;
      setResult(next);
      if (next.status === "pending" && ++polls < MAX_POLLS) timer = setTimeout(check, POLL_MS);
    };
    void check();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const status = result.status;
  return (
    <main className="min-h-screen bg-white text-[#1E1530]">
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
        {status === "loading" && (
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl" aria-live="polite">
            Checking your payment…
          </h1>
        )}

        {result.status === "paid" && (
          <>
            {/* Browser half of the Purchase event; the server sends its half with the same id. */}
            <PixelEvent event="Purchase" eventId={orderId} value={OFFER.priceInr} />
            <p className="text-sm font-semibold uppercase tracking-wider text-[#D9531E]">Payment received · ₹{OFFER.priceInr}</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              Your seat is confirmed{result.firstName ? `, ${result.firstName}` : ""}.
            </h1>
            <p className="mt-5 text-lg text-[#5B5270]">
              See you live on{" "}
              <strong className="text-[#1E1530]">
                {OFFER.dateLabel}, {startTimeLabel()}
              </strong>
              , in {OFFER.language}.
              {!result.whatsapp && " The joining link and reminders will come to your email and WhatsApp."}
            </p>
            {result.whatsapp && (
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
                  href={result.whatsapp}
                  rel="noopener noreferrer"
                  target="_blank"
                  className={`${btn} mt-5 w-full gap-2 bg-[#128C4A] text-lg text-white`}
                >
                  <Chat className="size-5" />
                  Join the WhatsApp group
                </a>
                {result.emailOn && <p className="mt-3 text-sm text-[#5B5270]">A copy of this link is also on its way to your email.</p>}
              </section>
            )}
            {result.duplicate && (
              <p className="mt-5 rounded-2xl border border-[#D9531E]/30 bg-[#D9531E]/5 px-5 py-4 text-[#1E1530]">
                This email or WhatsApp number had already paid once, so this is a second payment for the same seat.{" "}
                <a className="font-semibold underline" href="/contact">
                  Contact us
                </a>{" "}
                with this page&apos;s link.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={calendarUrl()} rel="noopener noreferrer" target="_blank" className={`${btn} border border-[#1E1530]/15 text-[#1E1530]`}>
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
