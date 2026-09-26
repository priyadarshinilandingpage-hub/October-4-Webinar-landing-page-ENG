import { FOOTER, PS } from "../content";
import { CtaLink, Rule, Wordmark } from "../ui";
import { Fx } from "./Fx";

/**
 * 14a · The P.S. (the most-read line after the headline) as a note torn from her spiral notebook:
 * ruled paper, red margin, the sign-off in the italic serif with a pencil flourish that draws itself.
 */
export function Ps() {
  return (
    <section aria-labelledby="ps-title" className="fj-sec feather tint-lilac pt-6 pb-10 md:pb-14">
      <div className="wrap">
        <div className="fj-note-wrap mx-auto max-w-2xl">
          <div className="fj-note fj-ruled">
            <h2 id="ps-title" className="font-serif text-[2.6rem] leading-none text-saffron-deep italic">
              P.S.
            </h2>
            <p className="mt-4 text-[1.05rem] leading-[32px] text-ink sm:text-[1.1rem]">{PS.body}</p>
            <p className="fj-hand mt-2 text-[1.35rem] leading-[32px] text-ink">{PS.close}</p>
            <Fx className="mt-4 inline-block">
              <p className="fj-hand text-[2.3rem] leading-none text-ink">{PS.sign}</p>
              <svg aria-hidden="true" viewBox="0 0 220 26" className="fj-flourish fj-draw -mt-1 h-6 w-48" style={{ ["--d" as string]: "300ms", ["--dur" as string]: "1.1s" }}>
                <path
                  pathLength={1}
                  d="M3 17c28-6 58-9 88-7 22 1.6 30 7 20 10-9 2.5-14-5 1-9 30-8 72-9 105-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Fx>
            <CtaLink size="lg" className="mt-6 w-full sm:w-auto">
              {PS.cta}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 14b · Footer with the policy links Razorpay KYC looks for, set like a ledger index. */
export function Footer() {
  return (
    <footer className="fj-sec pt-6 pb-28 md:pb-12">
      <div className="wrap">
        <Rule variant="double" />
        <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <Wordmark />
          <nav aria-label="Policies">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {FOOTER.links.map((l, i) => (
                <li key={l.href}>
                  <a href={l.href} className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink">
                    <span className="underline-offset-4 group-hover:underline">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="max-w-3xl text-xs leading-relaxed text-ink-2">{FOOTER.disclaimer}</p>
        <p className="fj-mono mt-3 text-ink-2">{FOOTER.copyright}</p>
      </div>
    </footer>
  );
}
