import type { Metadata, Viewport } from "next";
import { LandingPage, THEME_COLOR } from "@/components/LandingPage";

// Same page as `/`, with the Tanglish lines in plain English (for English ad sets; link ads here with the same
// utm parameters). Kept out of search results as a duplicate of `/`.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR.dark,
};

export default function EnglishHome() {
  return <LandingPage lang="en" />;
}
