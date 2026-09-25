import { JOURNEY } from "../content";
import { Media } from "../Media";
import { CtaLink, SectionHead } from "../ui";
import { Fx } from "./Fx";
import { idx } from "./fxStyle";

const TILT = ["-1.2deg", "0.9deg", "-0.5deg", "1.3deg"];
const TAPE = ["", "fj-tape--rose", "fj-tape--violet"];

/**
 * 6 · The build diary: torn notebook pages, each with a rubber date stamp and a taped reel still.
 * Phones: pages stack, with "+9 days" notes in the gutter. Desktop: four pages side by side at
 * scrapbook heights, the gaps written vertically between them. Stamps thump in as the diary arrives.
 */
export function Journey() {
  return (
    <section id="journey" aria-labelledby="journey-title" className="fj-sec feather tint-lilac pt-12 pb-16 md:pt-16 md:pb-20">
      <div className="wrap">
        <SectionHead id="journey-title" kicker={JOURNEY.kicker} title={JOURNEY.title} titleEm={JOURNEY.titleEm} lead={JOURNEY.lead} />

        <ol className="fj-diary mt-7 md:mt-10">
          {JOURNEY.items.map((it, i) => (
            <Fx as="li" key={it.day} className="fj-entry" style={idx(i)}>
              <div className="fj-page-wrap">
                <article className="fj-page fj-ruled" style={{ ["--tilt" as string]: TILT[i] }}>
                  <span
                    className="fj-stamp fj-stamp--violet fj-stamp-in fj-stamp--lg fj-num"
                    style={idx(i, { rotate: i % 2 ? "3deg" : "-5deg" })}
                  >
                    {it.day}
                  </span>
                  <div className="fj-page-row">
                    <div className="fj-snap">
                      <span aria-hidden="true" className={`fj-tape ${TAPE[i % TAPE.length]} !w-16`} />
                      <Media slot={it.media} sizes="(min-width:1024px) 240px, 38vw" className="aspect-[3/4] w-full" />
                    </div>
                    <div className="min-w-0 pt-1 lg:pt-0">
                      <h3 className="font-serif text-[1.45rem] leading-[1.1] text-ink italic">{it.title}</h3>
                      <p className="mt-2 text-[0.95rem] leading-[28px] text-ink-2">{it.body}</p>
                    </div>
                  </div>
                </article>
              </div>
              <p aria-hidden="true" className="fj-gap fj-mono">
                {JOURNEY.gaps[i]}
              </p>
            </Fx>
          ))}

          <Fx as="li" className="fj-entry" style={idx(JOURNEY.items.length)}>
            <div className="fj-page-wrap">
              <article className="fj-page fj-page--final fj-ruled" style={{ ["--tilt" as string]: TILT[3] }}>
                <span
                  className="fj-stamp fj-stamp-in fj-stamp--lg fj-num"
                  style={idx(JOURNEY.items.length, { rotate: "-4deg" })}
                >
                  {JOURNEY.finale.day} · {JOURNEY.finale.stamp}
                </span>
                <h3 className="mt-4 font-serif text-[2.2rem] leading-none text-ink italic">{JOURNEY.finale.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-[28px] text-ink-2">{JOURNEY.finale.body}</p>
                <CtaLink className="mt-5 w-full">{JOURNEY.cta}</CtaLink>
              </article>
            </div>
          </Fx>
        </ol>
      </div>
    </section>
  );
}
