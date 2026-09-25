import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { LandingPage, pickTheme, pickVariant, THEME_COLOR } from "@/components/LandingPage";
import { THEME_COOKIE } from "@/components/theme";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function themeFor(searchParams: Props["searchParams"]) {
  const { theme } = await searchParams;
  return pickTheme(theme, (await cookies()).get(THEME_COOKIE)?.value);
}

/** ?theme= is a duplicate of `/`: keep it out of search results. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { theme } = await searchParams;
  return theme ? { robots: { index: false, follow: true } } : {};
}

/** Browser chrome colour follows the theme. */
export async function generateViewport({ searchParams }: Props): Promise<Viewport> {
  return { themeColor: THEME_COLOR[await themeFor(searchParams)] };
}

/** `/`: light by default; the visitor's toggle choice (cookie) or ?theme=dark switches it. utm_content picks the ad-matched hero. */
export default async function Home({ searchParams }: Props) {
  const { utm_content } = await searchParams;
  return <LandingPage variant={pickVariant(utm_content)} theme={await themeFor(searchParams)} />;
}
