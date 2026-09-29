import type { Metadata, Viewport } from "next";
import { AlreadyPaid } from "./AlreadyPaid";

export const metadata: Metadata = {
  title: "Already registered · Webinar",
  robots: { index: false, follow: false },
};

// Same deep violet as the landing page, so the phone's browser bar matches.
export const viewport: Viewport = { themeColor: "#0f0620" };

// Shown when the order form gets an email or WhatsApp number that has already paid (POST /api/orders → 409).
export default function AlreadyPaidPage() {
  return <AlreadyPaid />;
}
