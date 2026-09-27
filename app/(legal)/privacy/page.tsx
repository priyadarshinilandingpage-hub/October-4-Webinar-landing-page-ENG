import type { Metadata } from "next";
import { PolicyHeader } from "../legal-ui";

export const metadata: Metadata = { title: "Privacy Policy" };

// Empty on purpose (27 Sep 2026): the client writes this policy herself. The old draft is in git history.
export default function PrivacyPage() {
  return (
    <article>
      <PolicyHeader title="Privacy Policy" updated={false} />
    </article>
  );
}
