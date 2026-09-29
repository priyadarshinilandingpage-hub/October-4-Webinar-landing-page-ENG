import type { ReactNode } from "react";
import { Countdown } from "../Countdown";
import { EVENT, HERO, HERO_MEDIA, HERO_SHARED, type HeroCopy } from "../content";
import { Lock } from "../icons";
import { InstagramProfile } from "../InstagramProfile";
import { Media } from "../Media";
import { Odometer, PetalReveal, RiseText } from "../motion";
import { ByAd, ByLang, CtaLink, Postmark, PriceTag } from "../ui";

/**
 * 1 · Image-first hero. One DOM, two compositions (so the LCP photo is only loaded once):
 * - Phones/tablets (<lg): a full-bleed photo plate (~58svh) carrying the authority tags, a specimen
 *   caption with the blooming crocus and a rubber postmark; then ONLY a typed date line, a ≤8-word
 *   headline, one support line, the CTA and a tiny trust line.
 * - Desktop (lg+): editorial spread. Photo plate on the left with tags pinned across its bottom edge,
 *   a postmark on its corner and a figure caption; the oversized serif headline starts one column
 *   over the plate edge on paper strips; support, CTA + countdown and a margin note sit to the right.
 * The headline is message-matched to the ad: both versions are in the page, <ByAd> shows the one for this visit.
 * `floral` (bold-type variant only, /bold): the crocus bouquet behind the headline (`crown`) and the blooms
 * on the photo plate (`plate`), from components/Flowers.tsx via LandingPage. Absent by default: the markup
 * is then exactly the ledger hero.
 */
export function Hero({ floral }: { floral?: { crown: ReactNode; plate: ReactNode } }) {
  const s = HERO_SHARED;
  const inset = HERO_MEDIA.inset;
  /** Both ads' copy, one shown (see <ByAd>). */
  const byAd = (pick: (c: HeroCopy) => ReactNode) => <ByAd a={pick(HERO.a)} b={pick(HERO.b)} />;
  const titleSize = (c: HeroCopy) =>
    c.title.map((x) => x.t).join("").length > 60 ? "text-[clamp(3rem,4.7vw,4.35rem)]" : "text-[clamp(3.3rem,5.6vw,5.4rem)]";
  return (
    <section id="hero" aria-labelledby="hero-title" className="feather tint-hero relative pb-12 sm:pb-16 lg:pt-10 lg:pb-14">
      <div className="wrap flex flex-col max-lg:px-0 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-6">
        {/* Copy comes first in the DOM (heading order) but is shown after the photo on phones. */}
        <div className="hero-col relative z-10 order-2 px-4 pt-4 sm:px-6 sm:pt-7 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:px-0 lg:pt-14">
          <p className="lbl flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.63rem] text-ink-2 sm:text-[0.7rem] lg:pl-[calc((100%_+_1.5rem)/7)]">
            <span className="live-dot mr-1" aria-hidden="true" />
            {s.eyebrow.map((part, i) => (
              <span key={part} className={i === 0 ? "text-ink" : ""}>
                {i > 0 && (
                  <span aria-hidden="true" className="mr-2 text-saffron-deep">
                    ·
                  </span>
                )}
                {part}
              </span>
            ))}
          </p>

          <h1 id="hero-title" className="mt-2.5 font-serif tracking-[-0.02em] text-ink lg:mt-5">
            <span className="block text-[clamp(2.1rem,9vw,3.4rem)] leading-[1.02] lg:hidden">
              {byAd((c) => (
                <ByLang
                  ta={<RiseText segments={c.short} trigger="load" emClassName="text-violet-deep" delay={0.12} />}
                  en={<RiseText segments={c.shortEn} trigger="load" emClassName="text-violet-deep" delay={0.12} />}
                />
              ))}
            </span>
            {byAd((c) => (
              <span className={`hero-strip hidden leading-[1.1] lg:block ${titleSize(c)}`}>
                <ByLang
                  ta={<RiseText segments={c.title} trigger="load" emClassName="text-violet-deep" delay={0.1} />}
                  en={<RiseText segments={c.titleEn} trigger="load" emClassName="text-violet-deep" delay={0.1} />}
                />
              </span>
            ))}
          </h1>

          <div className="lg:pl-[calc((100%_+_1.5rem)/7)]">
            <p className="mt-2 max-w-md text-[0.98rem] leading-snug text-ink-2 lg:hidden">
              {byAd((c) => (
                <ByLang ta={c.shortSub} en={c.shortSubEn} />
              ))}
            </p>
            <p className="mt-6 hidden max-w-xl text-[1.15rem] leading-relaxed font-medium text-ink lg:block">
              {byAd((c) => (
                <ByLang ta={c.sub} en={c.subEn} />
              ))}
            </p>

            {/* The price, big, before the button: total value struck out, ₹99 next to it. */}
            <p className="mt-5 flex items-baseline gap-3 lg:mt-7">
              <PriceTag size="lg" />
              <span className="lbl text-ink-2">{s.priceNote}</span>
            </p>

            <div className="mt-4 flex flex-col items-stretch gap-5 sm:flex-row sm:items-center lg:mt-6 lg:gap-7">
              <CtaLink size="lg" className="w-full sm:w-auto" price={EVENT.price}>
                <ByLang ta={s.cta} en={s.ctaEn} />
              </CtaLink>
              <div className="hidden lg:block">
                <Countdown label={s.countdownLabel} />
              </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[0.75rem] leading-snug text-ink-2 lg:mt-5 lg:text-[0.8rem]">
              <Lock className="size-3.5 shrink-0" />
              {s.trust}
            </p>

          </div>

          {floral?.crown}
        </div>

        {/* The photo plate. */}
        <figure className="order-1 lg:order-none lg:col-span-6 lg:col-start-1 lg:row-start-1">
          <div className="relative">
            <PetalReveal
              trigger="load"
              className="relative h-[clamp(330px,58svh,620px)] overflow-hidden lg:aspect-[4/5] lg:h-auto lg:max-h-[calc(100svh-8rem)] lg:min-h-[500px]"
            >
              <Media
                slot={HERO_MEDIA.stage}
                eager
                position={HERO_MEDIA.stageFocus}
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="h-full w-full"
              />
              <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-x-0 bottom-0 h-[48%] lg:h-[30%]" />
            </PetalReveal>

            {floral?.plate}

            <Postmark
              ring={s.stamp.ring}
              center={s.stamp.center}
              sub={s.stamp.sub}
              subStrike
              className="absolute top-2.5 right-2.5 size-[84px] sm:top-4 sm:right-4 sm:size-24 lg:-top-10 lg:right-auto lg:-left-10 lg:size-[120px]"
            />

            {/* Authority tags: over the photo on phones, pinned across the bottom edge on desktop. */}
            <ul
              aria-label="Credentials"
              className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2 sm:inset-x-6 sm:bottom-6 sm:max-w-md lg:inset-x-auto lg:-bottom-9 lg:left-5 lg:w-[min(24rem,80%)]"
            >
              {s.badges.map((b, i) => (
                <li key={b.label} className={`tag ${i % 2 ? "rotate-[0.8deg]" : "-rotate-[0.8deg]"}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="tag-v">
                      <Odometer value={b.value} delay={0.35 + i * 0.08} />
                    </span>
                    {i === 0 && <Media slot={HERO_MEDIA.avatar} sizes="32px" className="-my-1 size-6 shrink-0 ring-1 ring-ink/20" />}
                  </span>
                  <span className="tag-c">{b.label}</span>
                </li>
              ))}
            </ul>

            {/* A second, smaller plate pasted on: her at work in the grow room ("what she has built").
                Phones: under the postmark, clear of her face. Desktop: over the plate's left edge, away from
                the headline strips (which cross the right edge), above every other hero layer. */}
            {inset.src && (
              <div className="absolute top-[100px] right-3 z-[4] w-[29%] max-w-[160px] rotate-[2deg] bg-paper p-1 pb-1.5 shadow-lift sm:top-[132px] sm:right-5 lg:top-[30%] lg:right-auto lg:left-[-1.75rem] lg:w-[30%] lg:max-w-[220px] lg:-rotate-[2deg] lg:p-1.5">
                <Media slot={inset} sizes="(min-width: 1024px) 220px, 160px" className="aspect-[4/5] w-full" />
                <p className="mt-1 text-center text-[0.55rem] leading-tight font-semibold tracking-[0.06em] text-ink-2 uppercase lg:mt-1.5 lg:text-[0.66rem]">
                  {s.insetCaption}
                </p>
              </div>
            )}
          </div>
        </figure>

        {/* Her Instagram profile, rebuilt as page elements (components/InstagramProfile.tsx): full width under the
            photo and the copy, so it reads as proof right after the price and the button. */}
        <div className="order-3 mt-8 px-4 sm:px-6 lg:col-span-12 lg:row-start-2 lg:mt-4 lg:px-0">
          <InstagramProfile />
        </div>
      </div>
    </section>
  );
}
