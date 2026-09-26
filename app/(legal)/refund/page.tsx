import type { Metadata } from "next";
import { OFFER } from "@/lib/offer";
import { Biz, PolicyHeader, Section, Todo } from "../legal-ui";

export const metadata: Metadata = { title: "Refund & Cancellation Policy" };

// DRAFT for client review. Only promise what the client will actually honour.
export default function RefundPage() {
  return (
    <article>
      <PolicyHeader
        title="Refund & Cancellation Policy"
        intro={
          <p>
            This policy applies to the ₹{OFFER.priceInr} registration fee for the live webinar &quot;{OFFER.title}&quot;
            on {OFFER.dateLabel}, sold by <Biz k="legalName" />.
          </p>
        }
      />

      <Section title="1. When you will always get a full refund">
        <ul>
          <li>
            <strong>Failed payment but money debited:</strong> if your payment failed but money left your account, it is
            usually reversed automatically by your bank or Razorpay within 5 to 7 working days. If it isn&apos;t,
            contact us and we will help.
          </li>
          <li>
            <strong>Charged twice:</strong> if you were charged more than once for the same registration, we refund
            every extra payment in full.
          </li>
          <li>
            <strong>We cancel the Webinar:</strong> if we cancel and do not hold it again, everyone gets a full refund.
          </li>
          <li>
            <strong>We reschedule and you can&apos;t attend:</strong> if we move the Webinar to another date or time and
            you cannot attend the new slot, tell us within 7 days of our announcement and we refund you
            in full. If you don&apos;t ask, your seat moves to the new slot.
          </li>
        </ul>
      </Section>

      <Section title="2. Other cancellations by you">
        <p>
          Because the fee is small and seats are limited, we don&apos;t refund if you change your mind or miss the live
          session.
        </p>
        <p>
          If you can&apos;t attend, you may transfer your seat to someone else by emailing us their name, email and
          WhatsApp number at least 24 hours before the start.
        </p>
      </Section>

      <Section title="3. How to ask for a refund">
        <p>
          Email <Biz k="supportEmail" /> (or call <Biz k="supportPhone" />) with the name, email and phone number you
          registered with and your payment reference or order ID (shown on the confirmation page and in your payment
          app).
        </p>
      </Section>

      <Section title="4. How and when refunds are paid">
        <ul>
          <li>We reply to refund requests within 2 working days.</li>
          <li>
            Approved refunds are sent through Razorpay to the <strong>same account, card or UPI ID</strong> you
            paid with. We don&apos;t refund in cash or to a different account.
          </li>
          <li>
            After we start the refund, it usually reaches you within 5 to 7 working days, depending on your bank.
          </li>
        </ul>
      </Section>

      <Section title="5. Questions">
        <p>
          <Biz k="legalName" />, <Biz k="address" />. Email: <Biz k="supportEmail" />. Phone: <Biz k="supportPhone" />.
          Hours: <Biz k="supportHours" />.
        </p>
      </Section>
    </article>
  );
}
