import { NAV } from "./content";
import { ThemeToggle } from "./ThemeToggle";
import { CtaLink, Wordmark } from "./ui";
import { UrgencyBar } from "./UrgencyBar";

/** Slim sticky bar on a ledger double rule: brand, the typed live date, the one CTA (ticket with price stub). */
export function TopBar() {
  return (
    <header className="topbar sticky top-0 z-50">
      <UrgencyBar />
      <div className="wrap flex h-[70px] items-center justify-between gap-3">
        <a href="#top" className="-m-1 p-1" aria-label="Priyadharsini, Saffron & Business: back to top">
          <Wordmark />
        </a>
        <p className="lbl hidden items-center gap-2.5 text-ink-2 lg:inline-flex">
          <span className="live-dot" aria-hidden="true" />
          {NAV.liveLabel}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {/* Narrow phones: the hero CTA + the sticky bottom bar carry the action, so the bar keeps brand + theme switch. */}
          <CtaLink size="sm" pulse className="shrink-0 max-[399px]:hidden [&_.cta-arrow]:hidden sm:[&_.cta-arrow]:block">
            {NAV.cta}
          </CtaLink>
        </div>
      </div>
    </header>
  );
}
