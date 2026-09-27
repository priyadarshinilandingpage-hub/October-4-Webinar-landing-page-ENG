import type { Metadata } from "next";
import { PolicyHeader } from "../legal-ui";

export const metadata: Metadata = { title: "Terms & Conditions" };

// Empty on purpose (27 Sep 2026): the client writes these terms herself. The old draft is in git history.
export default function TermsPage() {
  return (
    <article>
      <PolicyHeader title="Terms & Conditions" updated={false} />
    </article>
  );
}
