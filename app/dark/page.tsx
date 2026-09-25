import type { Metadata, Viewport } from "next";
import { LandingPage, pickVariant, THEME_COLOR } from "@/components/LandingPage";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Same page as `/`, dark purple-pink theme. Kept out of search results (duplicate of `/`); ads can still link here.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR.dark,
};

export default async function DarkHome({ searchParams }: Props) {
  const { utm_content } = await searchParams;
  return <LandingPage variant={pickVariant(utm_content)} theme="dark" />;
}
