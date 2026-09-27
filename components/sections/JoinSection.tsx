import { CheckoutForm } from "../CheckoutForm";
import { Countdown } from "../Countdown";
import { EVENT, JOIN } from "../content";
import { ByAd, Kicker, TextLink } from "../ui";

/**
 * 8 · #join, the conversion point (every Register button scrolls here). Built as an admit card:
 * the application form on top (numbered, ledger-ruled fields) and a perforated tear-off stub holding
 * the price, the date and the live countdown. Phones: one short heading line, then the fields, then
 * "What happens next". Desktop: the stub sits to the left of the form, perforation running down between
 * them, and "What happens next" moves up beside the heading (grid placement only; DOM order unchanged).
 * No entrance animation here: the form must be usable the instant anyone lands.
 */
export function JoinSection() {
  return (
    <section id="join" aria-labelledby="join-title" className="fj-sec pt-6 pb-20 md:pt-8 md:pb-24">
      <div className="wrap lg:grid lg:grid-cols-12 lg:gap-x-10">
        <div className="max-w-3xl lg:col-span-7 lg:row-start-1 lg:self-end">
          {/* Phones: no kicker (display:none also keeps it out of the page numbering). */}
          <Kicker tone="light" className="max-sm:hidden">
            {JOIN.kicker}
          </Kicker>
          <h2 id="join-title" className="font-serif text-[clamp(1.8rem,5vw,3.6rem)] leading-[1.04] tracking-[-0.015em] text-white sm:mt-4">
            <ByAd a={JOIN.title.a} b={JOIN.title.b} />
          </h2>
          <p className="mt-3 hidden max-w-xl text-[1.06rem] leading-relaxed text-white/75 sm:block">{JOIN.lead}</p>
        </div>

        {/* light-island: the admit card stays light paper in the dark theme too (paper on a dark desk). */}
        <div className="fj-admit light-island mt-5 sm:mt-6 lg:col-span-12 lg:row-start-2 lg:mt-7">
          <div className="fj-admit-form">
            <div className="fj-formhead">
              <p className="fj-mono m-0 min-w-0 text-ink-2">
                <span className="text-ink">{JOIN.card.form}</span>
                <span className="hidden sm:inline"> · {JOIN.card.eyebrow}</span>
              </p>
              <p className="fj-num m-0 shrink-0 text-[1.15rem] leading-none font-bold text-saffron-deep">{EVENT.price}</p>
            </div>
            <CheckoutForm />
          </div>

          <aside aria-label={`${JOIN.card.form}: ${EVENT.price}, ${JOIN.card.when}`} className="fj-admit-stub">
            {/* Phones: price | date, then countdown, then the note. Desktop: one column, top to bottom. */}
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-5 gap-y-3 lg:grid-cols-1 lg:items-start lg:gap-y-5">
              <div className="lg:order-1">
                <p className="fj-num text-[2.6rem] leading-none font-bold tracking-tight text-saffron-deep lg:text-[3.6rem]">{EVENT.price}</p>
              </div>
              <div className="text-right lg:order-3 lg:border-t lg:border-dashed lg:border-ink/25 lg:pt-5 lg:text-left">
                <p className="fj-mono text-ink-2">{JOIN.card.eyebrow}</p>
                <p className="mt-1 text-[0.95rem] leading-snug font-semibold text-ink">{JOIN.card.when}</p>
              </div>
              <Countdown label={JOIN.countdownLabel} className="col-span-2 lg:order-4 lg:col-span-1" />
              <p className="col-span-2 text-[0.78rem] text-ink-2 lg:order-2 lg:col-span-1 lg:-mt-2">{JOIN.card.priceNote}</p>
              <div aria-hidden="true" className="fj-barcode hidden lg:order-5 lg:block" />
            </div>
          </aside>
        </div>

        {/* What happens next: three ledger entries (tablet: a row under the card; desktop: beside the heading). */}
        <div className="mt-8 md:mt-9 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mt-0 lg:self-end">
          <h3 className="fj-mono text-white/70">{JOIN.stepsTitle}</h3>
          <ol className="fj-steps mt-3">
            {JOIN.steps.map((s, i) => (
              <li key={s}>
                <span className="fj-mono shrink-0 text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="leading-relaxed text-white/85">{s}</span>
              </li>
            ))}
          </ol>
          <TextLink href="#about" arrow className="mt-4 text-sm font-semibold text-white lg:mt-2">
            {JOIN.backLink}
          </TextLink>
        </div>
      </div>
    </section>
  );
}
