import { AdAutoScroll } from "@/components/AdAutoScroll";
import { FloralDivider, FlowerDefs, HeroCrown, HeroPlateBlooms } from "@/components/Flowers";
import { HERO } from "@/components/content";
import { MobileCta } from "@/components/MobileCta";
import { MotionProvider, SaffronThread } from "@/components/motion";
import { About } from "@/components/sections/About";
import { Faq } from "@/components/sections/Faq";
import { FarmBento } from "@/components/sections/FarmBento";
import { Fit } from "@/components/sections/Fit";
import { Hero } from "@/components/sections/Hero";
import { JoinSection } from "@/components/sections/JoinSection";
import { Journey } from "@/components/sections/Journey";
import { Modules } from "@/components/sections/Modules";
import { Problem } from "@/components/sections/Problem";
import { ProofMarquee } from "@/components/sections/ProofMarquee";
import { Footer, Ps } from "@/components/sections/PsFooter";
import { Reviews } from "@/components/sections/Reviews";
import { Ticket } from "@/components/sections/Ticket";
import { ValueStack } from "@/components/sections/ValueStack";
import { TopBar } from "@/components/TopBar";
import type { Theme } from "@/components/theme";

export type Variant = "a" | "b";
export { THEME_COLOR, type Theme } from "@/components/theme";

type Raw = string | string[] | undefined;
const first = (raw: Raw) => (Array.isArray(raw) ? raw[0] : raw) ?? "";

/** Message match: utm_content=creative_b → women-angle hero; anything else → creative A (investor angle). */
export function pickVariant(raw: Raw): Variant {
  return /creative[_-]?b\b/i.test(first(raw)) ? "b" : "a";
}

/** Theme: an explicit ?theme= wins, then the visitor's saved choice (cookie from the toggle), else light. */
export function pickTheme(param: Raw, cookie?: string): Theme {
  const p = first(param).toLowerCase();
  if (p === "dark" || p === "light") return p;
  return cookie === "dark" ? "dark" : "light";
}

/**
 * The whole landing page, shared by `/` and `/dark`. One typography (bold type + crocus flowers, app/bold.css
 * under [data-type="bold"]) in two colour themes: globals.css re-maps every colour token under
 * [data-theme="dark"], so all utilities (bg-ivory, text-ink, bg-paper…) flip by themselves. The visitor can
 * switch themes from the top bar (components/ThemeToggle.tsx).
 */
export function LandingPage({ variant, theme }: { variant: Variant; theme: Theme }) {
  return (
    <div data-theme={theme} data-type="bold" className="theme-root">
      <MotionProvider>
        <TopBar />
        <main id="top" className="ledger-page relative overflow-x-clip">
          <SaffronThread />
          <AdAutoScroll />
          <FlowerDefs />
          <Hero copy={HERO[variant]} floral={{ crown: <HeroCrown />, plate: <HeroPlateBlooms /> }} />
          <ProofMarquee />
          <FarmBento />
          <Problem />
          <FloralDivider />
          <Modules />
          <Journey />
          {/* The one contrast band: value stack + checkout, feathered in and out. */}
          <div className="plum-zone">
            <ValueStack />
            <JoinSection variant={variant} />
          </div>
          {/* Clears the band's feathered tail so dark text never sits on it (Reviews may be hidden). */}
          <div aria-hidden="true" className="h-8 md:h-10" />
          <Reviews />
          <Fit />
          <FloralDivider variant="trio" />
          <About />
          <Faq />
          <FloralDivider />
          <Ticket />
          <Ps />
        </main>
        <Footer />
        <MobileCta />
      </MotionProvider>
    </div>
  );
}
