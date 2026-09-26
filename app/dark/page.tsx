import type { Metadata, Viewport } from "next";
import { LandingPage, THEME_COLOR } from "@/components/LandingPage";

// Same page as `/`, built in the dark purple-pink theme. Kept out of search results (duplicate of `/`); ads can
// still link here.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR.dark,
};

export default function DarkHome() {
  return <LandingPage theme="dark" />;
}
