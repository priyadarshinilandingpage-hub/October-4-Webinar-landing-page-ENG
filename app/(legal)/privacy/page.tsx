import type { Metadata } from "next";
import { OFFER } from "@/lib/offer";
import { Biz, PolicyHeader, Section, Todo } from "../legal-ui";

export const metadata: Metadata = { title: "Privacy Policy" };

// DRAFT for client/legal review. Written to match India's Digital Personal Data Protection Act, 2023
// and what this website actually does. Update it if the data flows change.
export default function PrivacyPage() {
  return (
    <article>
      <PolicyHeader
        title="Privacy Policy"
        intro={
          <p>
            This policy explains what personal data <Biz k="legalName" /> (&quot;we&quot;, &quot;us&quot;) collects when
            you register for the live webinar &quot;{OFFER.title}&quot; hosted by {OFFER.host}, why we collect it, and
            the choices you have. We follow the Digital Personal Data Protection Act, 2023 (DPDP Act) and the rules made
            under it.
          </p>
        }
      />

      <Section title="1. Who is responsible for your data">
        <p>
          <Biz k="legalName" />, <Biz k="address" />, is the &quot;Data Fiduciary&quot; for the personal data described
          here. You can reach us at <Biz k="supportEmail" /> or <Biz k="supportPhone" />.
        </p>
      </Section>

      <Section title="2. What we collect">
        <ul>
          <li>
            <strong>Details you type in the registration form:</strong> your name, email address and WhatsApp number,
            and whether you ticked the consent boxes.
          </li>
          <li>
            <strong>Payment status:</strong> Cashfree Payments tells us whether your payment succeeded, the amount, and
            a payment reference. <strong>We never see or store your card, UPI PIN or bank login details.</strong> You
            enter those on Cashfree&apos;s secure checkout, not on our website.
          </li>
          <li>
            <strong>Campaign information:</strong> if you arrived from an ad, the campaign name in the link (for example
            &quot;utm_source&quot;), so we know which ads work.
          </li>
          <li>
            <strong>Technical data:</strong> your IP address is used briefly to block abuse (for example, too many
            attempts in a few minutes). Our hosting provider keeps standard server logs for security.
          </li>
          <li>
            <strong>Ad measurement:</strong> your browser type (&quot;user agent&quot;) and Meta advertising cookie IDs,
            if present, so we can measure our Facebook and Instagram ads (see section 5).
          </li>
        </ul>
        <p>We do not ask for, and please do not send us, sensitive information such as health or financial account details.</p>
      </Section>

      <Section title="3. Why we use it (purpose)">
        <ul>
          <li>To register you for the webinar and confirm your seat.</li>
          <li>
            To stop you being charged twice for the same seat: if the email or WhatsApp number you enter has already
            paid for this session, we show you that instead of starting a second payment.
          </li>
          <li>To send you the joining link, reminders and any change to the schedule, by email and WhatsApp.</li>
          <li>To process your payment and any refund through Cashfree Payments, and to keep records required by law (for example, tax and accounting records).</li>
          <li>To answer your questions and resolve complaints.</li>
          <li>To keep the website secure and prevent fraud or misuse.</li>
          <li>To measure which of our Meta (Facebook/Instagram) ads bring visitors and registrations (see section 5).</li>
          <li>
            <strong>Only with your separate, optional consent:</strong> to send you news about future webinars and offers.
          </li>
        </ul>
        <p>
          You give consent for registration by ticking the required box in the form. Marketing consent is a separate box
          that is unticked by default. Registering does not depend on it.
        </p>
      </Section>

      <Section title="4. Who we share it with">
        <p>We do not sell your personal data. We share it only with service providers who process it for us:</p>
        <ul>
          <li>
            <strong>Cashfree Payments India Pvt. Ltd.</strong>: payment processing. Your name, email and phone number
            are sent to Cashfree to create your payment.
          </li>
          <li>
            <strong>Website hosting:</strong> our website hosting provider runs
            this website and processes requests to it.
          </li>
          <li>
            <strong>Google Firebase (Cloud Firestore):</strong> stores the registration record of each paid seat (name,
            email, WhatsApp number, amount, payment reference and the ad campaign you came from).
          </li>
          <li>
            <strong>Abuse protection:</strong> our rate-limiting service briefly stores a counter linked to your IP
            address to limit repeated attempts.
          </li>
          <li>
            <strong>Communication tools:</strong> Resend, which sends our confirmation emails, and our WhatsApp tools,
            used to send you the joining details and reminders.
          </li>
          <li>
            <strong>Webinar platform:</strong> the online video platform used for the session, when you join it.
          </li>
          <li>
            <strong>Meta Platforms:</strong> the Meta Pixel on our pages tells Meta about page visits, when you start the
            payment, and when you complete it. After a successful payment we also send Meta a &quot;purchase&quot;
            signal with your email, phone number and first name converted into an irreversible code (SHA-256 hash), plus
            the order reference and amount. This helps us measure which ads work.
          </li>
          <li>Government authorities, courts or regulators, when the law requires it.</li>
        </ul>
        <p>
          Some of these providers may store or process data outside India. We only use providers that protect data
          under contract, and we do not transfer data to any country the Government of India has restricted.
        </p>
      </Section>

      <Section title="5. Cookies and tracking">
        <p>
          Our pages load the Meta Pixel, which may set Meta advertising cookies (such as &quot;_fbp&quot;) to measure our
          Facebook and Instagram ads. It records page visits, when you start the payment and when you complete it. It
          does not read what you type in the form. You can block these cookies in your browser settings or with an ad
          blocker; the website and registration still work. We do not store your form details in your browser.
        </p>
      </Section>

      <Section title="6. How long we keep it">
        <ul>
          <li>Registration details: until 6 months after the webinar, to handle questions and refunds, then deleted.</li>
          <li>Payment and invoice records: as long as tax and accounting laws require (usually up to 8 years).</li>
          <li>Marketing list: until you withdraw consent or unsubscribe.</li>
          <li>Security logs: kept by our hosting provider for a short period, usually up to 30 days.</li>
        </ul>
      </Section>

      <Section title="7. Your rights">
        <p>Under the DPDP Act you can:</p>
        <ul>
          <li>ask for a summary of the personal data we hold about you and who we shared it with;</li>
          <li>ask us to correct, complete or update it;</li>
          <li>ask us to erase it, unless we must keep it by law (for example, payment records);</li>
          <li>
            <strong>withdraw your consent at any time</strong>, as easily as you gave it. For marketing, use the
            unsubscribe link in any email or write to us. Withdrawing consent does not affect anything done before you
            withdrew it. If you withdraw consent for registration before the webinar, we may not be able to send you
            the joining details;
          </li>
          <li>nominate another person to exercise these rights for you if you die or become unable to do so;</li>
          <li>raise a grievance with us, and then with the Data Protection Board of India if you are not satisfied.</li>
        </ul>
        <p>
          To use any of these rights, write to <Biz k="grievanceEmail" />. We may ask you to confirm your identity. We
          aim to reply within 7 days and to resolve grievances within 30 days.
        </p>
      </Section>

      <Section title="8. Grievance Officer">
        <p>
          <Biz k="grievanceOfficer" />
          <br />
          <Biz k="legalName" />, <Biz k="address" />
          <br />
          Email: <Biz k="grievanceEmail" />
        </p>
      </Section>

      <Section title="9. Security">
        <p>
          The website uses HTTPS encryption. Payments happen on Cashfree&apos;s PCI DSS certified checkout. Access to
          registration data is limited to the people who run the webinar. If a personal data breach happens, we will
          inform the Data Protection Board of India and affected people as the law requires.
        </p>
      </Section>

      <Section title="10. Children">
        <p>
          The webinar is meant for adults. You must be 18 or older to register. We do not knowingly collect personal
          data of children.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          If we change this policy, we will update the date at the top of this page. For important changes, we will
          inform registered attendees by email.
        </p>
      </Section>
    </article>
  );
}
