import { FAQ } from "../content";
import { SectionHead } from "../ui";

/**
 * 12 · FAQ as a card file: each question is an index card (native <details>, zero JS). The red top line
 * appears when a card opens; the answer sits on ruled lines. Desktop: the cards run in two columns under
 * the heading.
 */
export function Faq() {
  const items = FAQ.items;

  return (
    <section id="faq" aria-labelledby="faq-title" className="fj-sec feather tint-cream py-12 md:py-16">
      <div className="wrap">
        <SectionHead
          id="faq-title"
          kicker={FAQ.kicker}
          title={FAQ.title}
          lead={
            <>
              {FAQ.lead}{" "}
              <a href="/contact" className="font-semibold text-violet-deep underline decoration-violet/40 underline-offset-4 hover:decoration-violet-deep">
                {FAQ.contactLabel}
              </a>
              .
            </>
          }
        />

        <div className="fj-faq mt-5 md:mt-6">
          {items.map((item) => (
            <details key={item.q} className="fj-card">
              <summary>
                <span>{item.q}</span>
                <span aria-hidden="true" className="fj-toggle text-ink-2" />
              </summary>
              <p className="fj-card-a fj-ruled">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
