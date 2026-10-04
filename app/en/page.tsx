import type { Metadata, Viewport } from "next";
import { Ui3Page } from "@/components/ui3/Ui3Page";
import "../ui3/ui3.css";

// Same page as `/` (the page is English). Kept so older ad links still work; out of search results as a duplicate.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0d0718",
};

export default function EnglishHome() {
  return <Ui3Page />;
}
