import type { Metadata, Viewport } from "next";
import { LandingPage, THEME_COLOR } from "@/components/LandingPage";
import { SITE_LANG } from "@/lib/site";

// `/`: pre-built as a plain file. Dark by default; public/boot.js applies ?theme= or the visitor's saved choice
// and the ad-matched headline before the first paint.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR.dark,
};

export default function Home() {
  return <LandingPage lang={SITE_LANG} />;
}
