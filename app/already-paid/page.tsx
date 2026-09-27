import type { Metadata } from "next";
import { AlreadyPaid } from "./AlreadyPaid";

export const metadata: Metadata = {
  title: "Already registered · Webinar",
  robots: { index: false, follow: false },
};

// Shown when the order form gets an email or WhatsApp number that has already paid (POST /api/orders → 409).
export default function AlreadyPaidPage() {
  return <AlreadyPaid />;
}
