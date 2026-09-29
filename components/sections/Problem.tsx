import { AI_ART, PROBLEM } from "../content";
import { Media } from "../Media";
import { ByLang, SectionHead } from "../ui";
import { Fx } from "./Fx";
import { idx } from "./fxStyle";

/**
 * 4 · The problem as a two-column ledger: "Most people…" is struck through row by row, "After 4 Oct,
 * you…" gets a pencil tick. The balance line carries the point.
 * Structure: <Fx> .fj-ledger → .fj-ledger-head, then <ol> of .fj-lrow (.fj-lcells holding the two sides:
 * .fj-dr "before" | .fj-cr "after"), then .fj-lbal (balance line).
 * Phones: each row stacks the "before" line over the "after" line; from md up the two sides are columns.
 * Desktop: the illustration sits beside the heading.
 */
export function Problem() {
  const rows = PROBLEM.before.map((dr, i) => ({ dr, cr: PROBLEM.after[i] ?? "" }));
  return (
    <section id="why" aria-labelledby="why-title" className="fj-sec feather tint-lilac py-10 md:py-12">
      <div className="wrap">
        <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-10">
          <SectionHead className="lg:col-span-6" id="why-title" kicker={PROBLEM.kicker} title={<ByLang ta={PROBLEM.title} en={PROBLEM.titleEn} />} lead={PROBLEM.lead} />
          <Media slot={AI_ART.problem} sizes="(min-width:1024px) 560px, 100vw" className="aspect-[21/9] w-full lg:col-span-6" />
        </div>

        <Fx className="fj-ledger mt-7 md:mt-9">
          {/* Column heads */}
          <div className="fj-ledger-head" aria-hidden="true">
            <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="fj-mono text-[0.74rem] text-ink-2 md:text-[0.8rem]">{PROBLEM.beforeTitle}</span>
              <span className="fj-mono text-[0.74rem] text-saffron-deep md:hidden">→</span>
              <span className="fj-mono text-[0.74rem] text-violet-deep md:hidden">{PROBLEM.afterTitle}</span>
            </p>
            <p className="m-0 hidden md:block">
              <span className="fj-mono text-[0.8rem] text-violet-deep">{PROBLEM.afterTitle}</span>
            </p>
          </div>

          <ol className="m-0 list-none p-0">
            {rows.map((r, i) => (
              <li key={r.dr} className="fj-lrow" style={idx(i)}>
                <div className="fj-lcells">
                  <p className="fj-dr">
                    <span>
                      <span className="sr-only">{PROBLEM.beforeTitle} </span>
                      <span className="fj-strike">{r.dr}</span>
                    </span>
                  </p>
                  <p className="fj-cr">
                    <Tick i={i} />
                    <span>
                      <span className="sr-only">{PROBLEM.afterTitle} </span>
                      {r.cr}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Balance line with the accountant's double underline. */}
          <div className="fj-lbal">
            <p className="fj-mono m-0 text-ink-2 max-md:hidden">{PROBLEM.balanceLabel}</p>
            <p className="m-0">
              <span className="fj-mono mr-2 text-ink-2 md:hidden">{PROBLEM.balanceLabel}</span>
              <span className="fj-double font-serif text-[1.55rem] leading-tight text-ink italic sm:text-[1.8rem]">{PROBLEM.balance}</span>
            </p>
          </div>
        </Fx>
      </div>
    </section>
  );
}

function Tick({ i }: { i: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="fj-draw relative top-[3px] size-[18px] shrink-0 overflow-visible text-saffron-deep"
      style={idx(i, { ["--d" as string]: "650ms", ["--dur" as string]: "0.4s" })}
    >
      <path pathLength={1} d="M3.5 13.2c2.2 1.6 3.9 3.5 5.3 6 2.6-6.1 6.4-10.9 11.7-14.6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
