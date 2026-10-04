import type { Metadata, Viewport } from "next";
import { Ui3Page } from "@/components/ui3/Ui3Page";
import "../ui3/ui3.css";

// Same page as `/` (the page has one look now). Kept so older ad links still work; out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0d0718",
};

export default function DarkHome() {
  return <Ui3Page />;
}
