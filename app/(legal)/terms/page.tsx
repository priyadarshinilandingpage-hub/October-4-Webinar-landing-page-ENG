import type { Metadata } from "next";
import { EVENT } from "@/components/content";
import { OFFER } from "@/lib/offer";
import { Biz, PolicyHeader, Section, Todo } from "../legal-ui";

export const metadata: Metadata = { title: "Terms & Conditions" };

// DRAFT for client/legal review.
export default function TermsPage() {
  return (
    <article>
      <PolicyHeader
        title="Terms & Conditions"
        intro={
          <p>
            These terms apply when you register for the live webinar &quot;{OFFER.title}&quot; (the
            &quot;Webinar&quot;) on this website. The website and the Webinar are run by <Biz k="legalName" />,{" "}
            <Biz k="address" /> (&quot;we&quot;, &quot;us&quot;). By registering, you agree to these terms.
          </p>
        }
      />

      <Section title="1. The Webinar">
        <ul>
          <li>
            Date: {OFFER.dateLabel}. Start time: {EVENT.timeLabel}. Duration: about 2 hours.
          </li>
          <li>Language: {OFFER.language} (with some English). Host: {OFFER.host}.</li>
          <li>
            Platform: an online video platform; the joining link is sent to your email and WhatsApp. You need a working internet connection and a
            phone or computer that can run it.
          </li>
          <li>Recording / replay: the webinar is live; a recording is not promised.</li>
        </ul>
      </Section>

      <Section title="2. Price and payment">
        <ul>
          <li>
            The registration fee is <strong>₹{OFFER.priceInr}</strong> per person,{" "}
            inclusive of all applicable taxes.
          </li>
          <li>
            Payments are processed securely by Cashfree Payments. We never see your card, UPI or bank login details.
          </li>
          <li>
            Your seat is confirmed only after Cashfree confirms the payment. You will see a confirmation page and receive
            the joining details by email and WhatsApp.
          </li>
          <li>Refunds are covered by our <a href="/refund">Refund &amp; Cancellation Policy</a>.</li>
        </ul>
      </Section>

      <Section title="3. Your registration">
        <ul>
          <li>You must be 18 or older and give correct contact details.</li>
          <li>
            One registration is for one person. Please do not share your joining link. We may remove anyone who joins
            with a link that was not issued to them.
          </li>
          <li>
            Please behave respectfully in the session and in any group chat. We may remove anyone who spams, harasses
            others or disrupts the session, without a refund.
          </li>
        </ul>
      </Section>

      <Section title="4. Educational content only, not financial advice">
        <p>
          The Webinar shares general education and the host&apos;s own experience about starting and growing a business,
          planning investment and managing capital. It is <strong>not</strong> personalised investment, financial,
          legal or tax advice, and the host is not acting as a SEBI-registered investment adviser. Any business or
          investment carries risk, including the loss of money. Results shared in the Webinar are examples, not promises.
          Please do your own research and speak to a qualified professional before making financial decisions.
        </p>
        <p>
          Information about loans and government schemes is given in good faith and may change. Eligibility and approval
          are decided by the bank or government body, not by us.
        </p>
      </Section>

      <Section title="5. Intellectual property">
        <p>
          The Webinar, slides, recordings, worksheets and other materials belong to <Biz k="legalName" /> or the host.
          They are for your personal use. You may not record, copy, resell or publish them without written permission.
        </p>
      </Section>

      <Section title="6. Changes to the Webinar">
        <p>
          If we must reschedule or cancel the Webinar, we will tell you by email and WhatsApp as early as possible. What
          happens to your fee is explained in the <a href="/refund">Refund &amp; Cancellation Policy</a>.
        </p>
      </Section>

      <Section title="7. Limitation of liability">
        <p>
          We work hard to run the Webinar smoothly, but we are not responsible for problems caused by your internet
          connection or device, by the webinar platform, or by events outside our reasonable control. To the extent the
          law allows, our total liability to you for anything related to the Webinar is limited to the fee you paid.
          Nothing in these terms limits any right you have under the Consumer Protection Act, 2019.
        </p>
      </Section>

      <Section title="8. Privacy">
        <p>
          We use your personal data as explained in our <a href="/privacy">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="9. Governing law and disputes">
        <p>
          These terms are governed by the laws of India. Please contact us first so we can try to resolve any issue.
          Otherwise, the courts at <Biz k="jurisdictionCity" /> have jurisdiction, without affecting your right to
          approach a consumer commission.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          <Biz k="legalName" />, <Biz k="address" />. Email: <Biz k="supportEmail" />. Phone: <Biz k="supportPhone" />.
        </p>
      </Section>
    </article>
  );
}
