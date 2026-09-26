import type { Metadata } from "next";
import { OFFER } from "@/lib/offer";
import { Biz, PolicyHeader, Section } from "../legal-ui";

export const metadata: Metadata = { title: "Contact Us" };

// Razorpay's website review looks for a business name, a physical address, an email and a phone number here.
export default function ContactPage() {
  return (
    <article>
      <PolicyHeader
        title="Contact Us"
        intro={<p>Questions about the webinar, your registration, payment or a refund? We&apos;re happy to help.</p>}
      />

      <Section title="Business details">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
          <dt className="font-medium text-[#1E1530]">Business name</dt>
          <dd><Biz k="legalName" /></dd>
          <dt className="font-medium text-[#1E1530]">Address</dt>
          <dd><Biz k="address" /></dd>
          <dt className="font-medium text-[#1E1530]">Email</dt>
          <dd><Biz k="supportEmail" /></dd>
          <dt className="font-medium text-[#1E1530]">Phone / WhatsApp</dt>
          <dd><Biz k="supportPhone" /></dd>
          <dt className="font-medium text-[#1E1530]">Support hours</dt>
          <dd><Biz k="supportHours" /></dd>
          <dt className="font-medium text-[#1E1530]">GSTIN</dt>
          <dd><Biz k="gstin" /></dd>
        </dl>
      </Section>

      <Section title="About the webinar">
        <p>
          &quot;{OFFER.title}&quot;, a live {OFFER.language} webinar with {OFFER.host} on {OFFER.dateLabel}. Registration
          fee ₹{OFFER.priceInr}.
        </p>
      </Section>

      <Section title="Privacy requests and grievances">
        <p>
          Grievance Officer: <Biz k="grievanceOfficer" />, <Biz k="grievanceEmail" />. See our{" "}
          <a href="/privacy">Privacy Policy</a> for your rights.
        </p>
      </Section>

      <Section title="When you write to us">
        <p>
          Please include the name, email and phone number you registered with, and your order ID if you have one. Never
          send us your card number, CVV, UPI PIN or OTP. We will never ask for them.
        </p>
      </Section>
    </article>
  );
}
