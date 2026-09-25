import { PROOF_MARQUEE } from "../content";
import { Stitch } from "../icons";
import { Rule } from "../ui";

/** 2 · Credentials ledger ticker between double rules: numbered entries stitched together with the saffron thread. */
export function ProofMarquee() {
  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="gap-9 pr-9">
      {PROOF_MARQUEE.map((item, i) => {
        const [label, value] = item.includes(" · ") ? item.split(" · ") : [null, item];
        return (
          <li key={item} className="flex items-center gap-9 whitespace-nowrap">
            <span className="flex items-baseline gap-2.5">
              {label && <span className="font-mono text-[0.64rem] font-medium tracking-[0.12em] text-ink-2 uppercase">{label}</span>}
              <span className="font-serif text-[1.3rem] leading-none text-ink">{value}</span>
            </span>
            <Stitch className="size-3 shrink-0 text-thread" />
          </li>
        );
      })}
    </ul>
  );

  return (
    <section aria-label="Credentials" className="relative py-2 md:py-3">
      <Rule variant="double" />
      <div className="marquee py-3 md:py-4">
        <div className="marquee-track">
          {list(false)}
          {list(true)}
        </div>
      </div>
      <Rule variant="double" />
    </section>
  );
}
