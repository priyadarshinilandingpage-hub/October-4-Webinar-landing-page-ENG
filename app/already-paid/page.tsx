import type { Metadata } from "next";
import { calendarUrl, OFFER, startTimeLabel } from "@/lib/offer";

export const metadata: Metadata = {
  title: "Already registered · Webinar",
  robots: { index: false, follow: false },
};

const btn = "inline-flex items-center justify-center rounded-2xl px-6 py-4 font-semibold transition-opacity hover:opacity-90";

// Shown when the order form gets an email or WhatsApp number that has already paid (POST /api/orders → 409).
// Anyone can open this URL, so it names no person and never shows the buyers' WhatsApp group link.
export default function AlreadyPaid() {
  return (
    <main className="min-h-screen bg-white text-[#1E1530]">
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#D9531E]">Seat already booked</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">You have already paid for this webinar.</h1>
        <p className="mt-5 text-lg text-[#5B5270]">
          This email or WhatsApp number already has a confirmed seat for{" "}
          <strong className="text-[#1E1530]">
            {OFFER.dateLabel}, {startTimeLabel()}
          </strong>
          . You don&apos;t need to pay again. The joining
          link is shared in the WhatsApp group from your confirmation page.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a href={calendarUrl()} rel="noopener noreferrer" target="_blank" className={`${btn} bg-[#1E1530] text-white`}>
            Add to Google Calendar
          </a>
          <a href="/contact" className={`${btn} border border-[#1E1530]/15 text-[#1E1530]`}>
            Lost the WhatsApp link? Contact us
          </a>
        </div>
        <p className="mt-10 text-sm text-[#5B5270]">
          Booking a seat for someone else? Use their own email and WhatsApp number.{" "}
          <a className="underline" href="/#join">
            Back to the form
          </a>
        </p>
      </div>
    </main>
  );
}
