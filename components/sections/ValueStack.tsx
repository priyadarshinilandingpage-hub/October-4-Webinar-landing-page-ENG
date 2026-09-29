import { BONUSES, EVENT, MODULES, VALUE } from "../content";
import { CtaLink, Postmark, SectionHead, Wordmark } from "../ui";
import { Fx } from "./Fx";

/**
 * 7 · Value stack on the plum band: a till receipt that prints out of a slot (stepped clip), itemised
 * like a ledger, with the price as a round rubber seal that thumps down once the receipt is out.
 */
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function ValueStack() {
  const totalValue = MODULES.items.length * VALUE.moduleValue + BONUSES.reduce((sum, b) => sum + b.value, 0);
  return (
    <section id="value" aria-labelledby="value-title" className="fj-sec pt-20 pb-6 md:pt-24 md:pb-8">
      <div className="wrap grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Desktop: the heading rides along (sticky) beside the long receipt instead of floating mid-height. */}
        <SectionHead className="lg:sticky lg:top-[calc(var(--topbar-h,60px)+28px)] lg:col-span-5" id="value-title" tone="light" kicker={VALUE.kicker} title={VALUE.title} lead={VALUE.lead} />

        <Fx className="mx-auto w-full max-w-[500px] lg:col-span-6 lg:col-start-7 lg:mr-0">
          <div aria-hidden="true" className="fj-slot" />
          <div className="fj-receipt-wrap">
            <div className="fj-receipt light-island fj-print px-5 pt-6 pb-8 sm:px-8 sm:pt-8">
              <Wordmark />

              <div className="fj-dash my-5" />

              <p className="font-semibold text-ink">{VALUE.mainLine}</p>
              <p className="mt-0.5 text-sm text-ink-2">{VALUE.mainSub}</p>

              <div aria-hidden="true" className="fj-mono mt-5 flex justify-between border-b border-ink/15 pb-2 text-ink-2">
                <span>{VALUE.colItem}</span>
                <span>{VALUE.colStatus}</span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {MODULES.items.map((m) => (
                  <Line key={m.n} n={m.n} label={`${m.tag}: ${m.title}`} value={inr(VALUE.moduleValue)} />
                ))}
                {BONUSES.map((b, i) => (
                  <Line key={b.label} n={`B${i + 1}`} label={b.label} value={inr(b.value)} />
                ))}
              </ul>

              <div className="fj-dash my-5" />

              {/* Total value, struck through: what all of it is worth on its own, against the ₹99 seal below. */}
              <div className="fj-rline text-[1rem] font-semibold text-ink">
                <span>{VALUE.totalValueLabel}</span>
                <span aria-hidden="true" className="fj-leader" />
                <s className="fj-num decoration-saffron-deep decoration-2">{inr(totalValue)}</s>
              </div>

              {/* Total: the accountant's double rule, then the seal. */}
              <div className="mt-5 flex items-center justify-between gap-4 border-t-4 border-double border-ink/30 pt-4">
                <div>
                  <p className="fj-mono text-[0.74rem] text-ink">{VALUE.totalLabel}</p>
                  <p className="mt-1 text-xs text-ink-2">{VALUE.totalNote}</p>
                  <p className="sr-only">{EVENT.price}</p>
                </div>
                <Fx className="shrink-0">
                  <div className="fj-stamp-in [--d:0.5s]">
                    <Postmark
                      pathId="value-postmark"
                      ring={`${VALUE.stampRing} `.toUpperCase()}
                      center={EVENT.price}
                      sub={VALUE.stampSub.toUpperCase()}
                      className="fj-seal size-[122px] sm:size-[136px]"
                    />
                  </div>
                </Fx>
              </div>

              <CtaLink size="lg" className="mt-6 w-full">
                {VALUE.cta}
              </CtaLink>

              <div aria-hidden="true" className="fj-barcode mt-6" />
            </div>
          </div>
        </Fx>
      </div>
    </section>
  );
}

function Line({ n, label, value }: { n: string; label: string; value: string }) {
  return (
    <li className="fj-rline text-[0.95rem] text-ink">
      <span className="w-7 shrink-0 font-mono text-xs text-violet-deep">{n}</span>
      <span className="min-w-0">{label}</span>
      <span aria-hidden="true" className="fj-leader" />
      <span className="fj-num shrink-0 self-center text-ink-2">{value}</span>
    </li>
  );
}
