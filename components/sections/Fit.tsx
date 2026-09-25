import { FIT } from "../content";
import { SectionHead } from "../ui";
import { Fx } from "./Fx";
import { idx } from "./fxStyle";

/**
 * 10 · The away statement as two loose slips, each stamped: FOR YOU (saffron, ticked boxes) and
 * NOT FOR YOU (muted, crossed boxes). Side by side from tablets (desktop: 7 / 5 columns, the "no" slip
 * dropped a little and tilted); stacked on phones. The stamps thump down and the ticks draw in once the slips arrive.
 */
export function Fit() {
  return (
    <section id="fit" aria-labelledby="fit-title" className="fj-sec feather py-12 md:py-16">
      <div className="wrap">
        <SectionHead id="fit-title" kicker={FIT.kicker} title={FIT.title} />

        <div className="mt-9 grid items-start gap-9 md:mt-11 md:grid-cols-2 md:gap-6 lg:grid-cols-12 lg:gap-8">
          <Fx as="article" labelledBy="fit-yes" className="fj-slip px-5 pt-7 pb-3 sm:px-7 sm:pt-8 lg:col-span-7" style={{ ["--tilt" as string]: "-0.6deg" }}>
            <span aria-hidden="true" className="fj-slip-stamp fj-stamp fj-stamp--lg fj-stamp-in" style={idx(0, { rotate: "-7deg" })}>
              ✓ {FIT.yesStamp}
            </span>
            <h3 id="fit-yes" className="pr-24 font-serif text-[1.75rem] leading-tight text-ink sm:text-[2rem]">
              {FIT.yesTitle}
            </h3>
            <ul className="fj-fitlist mt-3">
              {FIT.yes.map((t, i) => (
                <li key={t} className="text-ink">
                  <span aria-hidden="true" className="fj-box border-saffron-deep/60 text-saffron-deep">
                    <svg viewBox="0 0 24 24" className="fj-draw size-[18px] overflow-visible" style={idx(i, { ["--d" as string]: "520ms", ["--dur" as string]: "0.35s" })}>
                      <path pathLength={1} d="M4 13c2 1.5 3.6 3.3 5 5.8C11.6 12.6 15.4 7.8 21 4" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Fx>

          <Fx
            as="article"
            labelledBy="fit-no"
            className="fj-slip fj-slip--no px-5 pt-7 pb-3 sm:px-7 sm:pt-8 lg:col-span-5 lg:mt-8"
            style={{ ["--tilt" as string]: "1.1deg" }}
          >
            <span aria-hidden="true" className="fj-slip-stamp fj-stamp fj-stamp--muted fj-stamp--lg fj-stamp-in" style={idx(1, { rotate: "5deg" })}>
              ✕ {FIT.noStamp}
            </span>
            <h3 id="fit-no" className="pr-24 font-serif text-[1.5rem] leading-tight text-ink sm:text-[1.7rem]">
              {FIT.noTitle}
            </h3>
            <ul className="fj-fitlist mt-3">
              {FIT.no.map((t) => (
                <li key={t} className="text-ink-2">
                  <span aria-hidden="true" className="fj-box text-ink-2">
                    <svg viewBox="0 0 24 24" className="size-3.5">
                      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Fx>
        </div>
      </div>
    </section>
  );
}
