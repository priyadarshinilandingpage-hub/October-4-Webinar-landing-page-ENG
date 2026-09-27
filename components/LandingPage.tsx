import { WarmImages } from "@/components/WarmImages";
import { FloralDivider, FlowerDefs, HeroCrown, HeroPlateBlooms } from "@/components/Flowers";
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

export { THEME_COLOR, type Theme } from "@/components/theme";

/**
 * The whole landing page, shared by `/` and `/dark` (both pre-built static files). One typography (bold type +
 * crocus flowers, app/bold.css under [data-type="bold"]) in two colour themes: globals.css re-maps every colour
 * token under [data-theme="dark"], so all utilities (bg-ivory, text-ink, bg-paper…) flip by themselves.
 * - Theme: `/dark` is built dark. On `/`, public/boot.js applies ?theme= or the visitor's saved choice to <html>
 *   before the first paint; the top-bar toggle (components/ThemeToggle.tsx) switches it.
 * - Ad message match: the page carries both headlines; boot.js marks utm_content=creative_b and CSS shows the
 *   matching one (components/ui.tsx <ByAd>).
 */
export function LandingPage({ theme }: { theme?: Theme }) {
  return (
    <div data-theme={theme} data-type="bold" className="theme-root">
      <MotionProvider>
        <TopBar />
        <main id="top" className="ledger-page relative overflow-x-clip">
          <SaffronThread />
          <WarmImages />
          <FlowerDefs />
          <Hero floral={{ crown: <HeroCrown />, plate: <HeroPlateBlooms /> }} />
          <ProofMarquee />
          <FarmBento />
          <Problem />
          <FloralDivider />
          <Modules />
          <Journey />
          {/* The one contrast band: value stack + checkout, feathered in and out. */}
          <div className="plum-zone">
            <ValueStack />
            <JoinSection />
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
