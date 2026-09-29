import { Countdown } from "../Countdown";
import { EVENT, TICKET } from "../content";

import { CtaLink, Postmark, PriceTag, SectionHead, Wordmark } from "../ui";
import { Fx } from "./Fx";

/**
 * 13 · "About the webinar" as a printed ticket: the event details set like ticket fields
 * (two columns on wider screens), a barcode, and a perforated plum stub with the price, countdown and
 * final CTA. A round LIVE seal is stamped across the tear line (half on each part), thumping in on view.
 */
export function Ticket() {
  return (
    <section id="webinar" aria-labelledby="webinar-title" className="fj-sec feather tint-gold py-10 md:py-12">
      <div className="wrap">
        <SectionHead id="webinar-title" align="center" kicker={TICKET.kicker} title={TICKET.title} />

        {/* Opening animation (app/globals.css, "Ticket print"): the ticket prints out, then the stub slides in. */}
        <Fx className="fj-tix mx-auto mt-8 max-w-5xl md:mt-10">
          <div className="fj-tix-main">
            <div className="min-w-0 flex-1 px-5 pt-5 pb-6 sm:px-8 sm:pt-7 sm:pb-8">
              <Wordmark />
              <p className="mt-4 font-serif text-[clamp(1.75rem,3.4vw,2.7rem)] leading-[1.05] text-ink">{EVENT.title}</p>
              <dl className="fj-tix-rows mt-4">
                {TICKET.rows.map((r) => (
                  <div key={r.label}>
                    <dt className="fj-mono text-ink-2">{r.label}</dt>
                    <dd className="m-0 leading-snug font-semibold text-ink">{r.value}</dd>
                  </div>
                ))}
              </dl>
              <div aria-hidden="true" className="fj-barcode mt-5 max-w-[260px]" />
            </div>
          </div>

          {/* Zero-size hinge on the perforation: the seal straddles main + stub. */}
          <div aria-hidden="true" className="relative z-[3] h-0 min-[900px]:h-auto min-[900px]:w-0">
            <Fx className="absolute -top-12 right-3 min-[900px]:top-6 min-[900px]:right-auto min-[900px]:-left-12">
              <div className="fj-stamp-in [--d:200ms]">
              <Postmark
                pathId="ticket-postmark"
                ring={TICKET.stampRing.toUpperCase()}
                center={TICKET.stamp.toUpperCase()}
                className="fj-seal size-24 min-[900px]:size-[104px]"
              />
              </div>
            </Fx>
          </div>

          <div className="fj-tix-stub">
            <PriceTag size="xl" tone="light" />
            <Countdown variant="dark" label={TICKET.countdownLabel} className="w-full max-w-[280px]" />
            <CtaLink size="lg" price={false} className="w-full max-w-[280px]">
              {TICKET.cta}
            </CtaLink>
          </div>
        </Fx>
      </div>
    </section>
  );
}
