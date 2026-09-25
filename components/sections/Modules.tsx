import { AI_ART, MODULES } from "../content";
import { Media } from "../Media";
import { SectionHead } from "../ui";
import { Deck } from "./Fx";
import { idx } from "./fxStyle";

// Card stock cycles through the soft washes (all theme tokens, so they flip in dark mode).
const STOCK = ["bg-paper", "bg-cream", "bg-lilac-2", "bg-blush", "bg-paper", "bg-cream"];
const TILT = ["-1.2deg", "0.9deg", "-0.7deg", "1.1deg", "-0.9deg", "0.8deg"];
const TAPE = ["", "fj-tape--rose", "fj-tape--violet"];

/**
 * 5 · The six modules as index cards: a title tab, then the topic + what you get beside a big taped
 * illustration (phones: the print on top, then the text).
 * Phones/tablets: a swipeable deck (scroll-snap) with a "01 / 06" counter.
 * Desktop: the same list becomes a sticky pile; each card sticks a tab-height lower than the one before,
 * so by the end the six titles read like the index tabs of a card file.
 */
export function Modules() {
  const n = MODULES.items.length;
  return (
    <section id="learn" aria-labelledby="learn-title" className="fj-sec feather tint-cream py-12 md:py-16">
      <div className="wrap lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:sticky lg:top-[calc(var(--topbar-h,60px)+28px)] lg:col-span-4 lg:self-start">
          <SectionHead id="learn-title" kicker={MODULES.kicker} title={MODULES.title} lead={MODULES.lead} />
        </div>

        <div className="mt-7 lg:col-span-8 lg:mt-0">
          <Deck label="Webinar modules" count={n} itemLabel={MODULES.itemLabel} className="fj-deck">
            {MODULES.items.map((m, i) => (
              <li key={m.n} style={idx(i)}>
                <article aria-labelledby={`mod-${m.n}`} className={`fj-mod ${STOCK[i % STOCK.length]}`}>
                  <header className="fj-mod-tab">
                    <span className="fj-mono shrink-0 text-saffron-deep">{m.n}</span>
                    <span aria-hidden="true" className="h-px w-4 shrink-0 bg-ink/30" />
                    <h3 id={`mod-${m.n}`} className="min-w-0 font-serif text-[1.35rem] leading-tight text-ink sm:text-[1.5rem] lg:truncate">
                      {m.title}
                    </h3>
                  </header>
                  <div className="fj-mod-body">
                    <div className="fj-mod-text">
                      <p className="fj-mono text-violet-deep">{m.tag}</p>
                      <p className="fj-mod-copy">{m.body}</p>
                    </div>
                    <div aria-hidden="true" className="fj-mod-art" style={{ ["--tilt" as string]: TILT[i % TILT.length] }}>
                      <span className={`fj-tape ${TAPE[i % TAPE.length]}`} />
                      <Media
                        slot={AI_ART.modules[i]}
                        sizes="(min-width:1024px) 360px, (min-width:640px) 300px, 80vw"
                        className="aspect-[16/10] w-full"
                      />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </Deck>
        </div>
      </div>
    </section>
  );
}
