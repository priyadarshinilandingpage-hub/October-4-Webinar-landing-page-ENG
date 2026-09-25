import Image from "next/image";
import { ReviewLightbox } from "@/components/ReviewLightbox";
import { REVIEWS, REVIEWS_COPY, type MediaSlot } from "../content";
import { CtaLink, SectionHead } from "../ui";
import { Fx } from "./Fx";
import { idx } from "./fxStyle";

const TILT = ["-1.8deg", "1.2deg", "-0.7deg", "2deg", "-1.3deg", "0.8deg"];
const TAPE = ["", "fj-tape--rose", "fj-tape--violet"];

/**
 * 9 · Review screenshots pinned up like prints with washi tape (a loose, tilted masonry wall; desktop:
 * one row). Each real print is a button that opens the full-screen viewer (components/ReviewLightbox.tsx,
 * wired by data-review-index = the screenshot's position in the list of real screenshots).
 * Placeholders show only in development. In production the wall lists only real (ready) screenshots,
 * and the section is hidden until at least one exists.
 */
export function Reviews() {
  const items = process.env.NODE_ENV === "production" ? REVIEWS.filter((r) => r.src) : REVIEWS;
  if (items.length === 0) return null;
  const shots = items.filter((r) => r.src);
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="fj-sec feather tint-blush pt-10 pb-12 md:pt-12 md:pb-16">
      <div className="wrap">
        <SectionHead id="reviews-title" kicker={REVIEWS_COPY.kicker} title={REVIEWS_COPY.title} lead={REVIEWS_COPY.lead} />

        <ul className="mt-7 columns-2 gap-4 sm:gap-5 md:mt-9 md:columns-3 lg:grid lg:grid-cols-5 lg:items-start lg:gap-5">
          {items.map((r, i) => (
            <Fx as="li" key={r.expected} className="mb-5 break-inside-avoid pt-3 sm:mb-6 lg:mb-0" style={idx(i % 5)}>
              <ReviewPrint slot={r} index={i} shot={r.src ? shots.indexOf(r) : -1} />
            </Fx>
          ))}
        </ul>

        <div className="mt-6 flex justify-center md:mt-8">
          <CtaLink size="lg">{REVIEWS_COPY.cta}</CtaLink>
        </div>
      </div>

      <ReviewLightbox
        items={shots.map((r) => ({ src: r.src!, alt: r.alt, width: r.width ?? 1080, height: r.height ?? 1920 }))}
      />
    </section>
  );
}

const PH_HEIGHTS = ["h-[210px]", "h-[280px]", "h-[240px]", "h-[320px]", "h-[230px]"];

/** `shot` = index in the list of real screenshots (what the lightbox opens), -1 for a placeholder. */
function ReviewPrint({ slot, index, shot }: { slot: MediaSlot; index: number; shot: number }) {
  const tilt = { ["--tilt" as string]: TILT[index % TILT.length] };
  const tape = <span aria-hidden="true" className={`fj-tape ${TAPE[index % TAPE.length]}`} style={{ rotate: index % 2 ? "3deg" : "-4deg" }} />;

  if (slot.src && shot >= 0) {
    return (
      <figure className="fj-print-card fj-settle" style={tilt}>
        {tape}
        <button type="button" data-review-index={shot} aria-label={`Open review ${shot + 1}`} className="fj-print-btn">
          <Image
            src={slot.src}
            alt={slot.alt}
            width={slot.width ?? 1080}
            height={slot.height ?? 1350}
            sizes="(min-width:1024px) 220px, (min-width:768px) 33vw, 50vw"
            className="h-auto w-full"
          />
        </button>
      </figure>
    );
  }

  // Development-only placeholder (never rendered in production), not clickable.
  const file = slot.expected.split("/").pop();
  return (
    <figure role="img" aria-label={REVIEWS_COPY.placeholder} className="fj-print-card fj-settle" style={tilt}>
      {tape}
      <div aria-hidden="true" className={`fj-ruled flex flex-col justify-between bg-lilac-2 p-3 ${PH_HEIGHTS[index % PH_HEIGHTS.length]}`}>
        <span className="font-serif text-5xl leading-none text-gold">&ldquo;</span>
        <div>
          <p className="text-[0.78rem] leading-snug font-semibold text-ink-2">{REVIEWS_COPY.placeholder}</p>
          <p className="mt-1 truncate font-mono text-[0.64rem] text-ink-2">{file}</p>
        </div>
      </div>
    </figure>
  );
}
