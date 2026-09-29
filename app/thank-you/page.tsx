import type { Metadata, Viewport } from "next";
import { ThankYou } from "./ThankYou";

export const metadata: Metadata = {
  title: "Your seat · Webinar",
  robots: { index: false, follow: false },
};

// Same deep violet as the landing page, so the phone's browser bar matches.
export const viewport: Viewport = { themeColor: "#0f0620" };

// A pre-built page; ThankYou asks the server (GET /api/verify) whether this order is paid.
export default function ThankYouPage() {
  return <ThankYou />;
}
