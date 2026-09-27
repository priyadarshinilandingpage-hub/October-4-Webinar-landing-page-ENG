import type { Metadata } from "next";
import { PolicyHeader } from "../legal-ui";

export const metadata: Metadata = { title: "Refund & Cancellation Policy" };

// Empty on purpose (27 Sep 2026): the client writes this policy herself. The old draft is in git history.
export default function RefundPage() {
  return (
    <article>
      <PolicyHeader title="Refund & Cancellation Policy" updated={false} />
    </article>
  );
}
