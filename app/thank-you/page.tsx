import type { Metadata } from "next";
import { ThankYou } from "./ThankYou";

export const metadata: Metadata = {
  title: "Your seat · Webinar",
  robots: { index: false, follow: false },
};

// A pre-built page; ThankYou asks the server (GET /api/verify) whether this order is paid.
export default function ThankYouPage() {
  return <ThankYou />;
}
