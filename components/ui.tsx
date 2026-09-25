import { useId, type ReactNode } from "react";
import { BRAND } from "./content";
import { Crocus, ThreadArrow } from "./icons";
import { RiseText } from "./motion";

/*
 * "Saffron Ledger" UI kit: a founder's farm journal meets a business ledger.
 * No pills, no shimmer. Square-cut buttons with a ticket-stub price, specimen labels with a punched
 * hole, ledger numbering (01, 02…), rubber stamps and one red-orange saffron thread.
 * Every piece reads the colour tokens, so it flips automatically in the dark theme.
 */

/** Typographic wordmark: serif name + crocus glyph + typed tagline (no logo file needed). */
export function Wordmark({ tone = "ink", className = "" }: { tone?: "ink" | "light"; className?: string }) {
  const sub = tone === "light" ? "text-mist" : "text-ink-2";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Crocus className="size-6 shrink-0 sm:size-7" />
      <span className="flex flex-col leading-none">
        <span className={`font-serif text-[1.2rem] tracking-[-0.01em] sm:text-[1.35rem] ${tone === "light" ? "text-white" : "text-ink"}`}>
          {BRAND.name}
        </span>
        <span className={`mt-1 font-mono text-[0.56rem] font-medium tracking-[0.18em] uppercase ${sub}`}>{BRAND.tagline}</span>
      </span>
    </span>
  );
}

/**
 * Ledger / specimen label. Use instead of rounded pills, chips and badges.
 * - variant="ledger" (default): "03 / Capital" in typed small caps. Numbering is automatic
 *   (a page-wide CSS counter in document order); pass `n` to force a number ("03") or `n={false}` for none.
 * - variant="specimen": small rectangular tag with a punched hole (for badges/chips/tags on cards or images).
 * - variant="stamp": rubber-stamp box in stamp ink, slightly rotated (for "Live", "Sold out", "₹99" marks).
 * `tone="light"` = on the dark plum band.
 */
export function Label({
  children,
  variant = "ledger",
  n,
  tone = "ink",
  as = "p",
  className = "",
}: {
  children: ReactNode;
  variant?: "ledger" | "specimen" | "stamp";
  n?: string | number | false;
  tone?: "ink" | "light";
  as?: "p" | "span" | "div" | "li";
  className?: string;
}) {
  const Tag = as;
  const light = tone === "light" ? "lbl-light" : "";
  if (variant === "specimen") {
    return <Tag className={`lbl lbl-specimen ${light} ${className}`}>{children}</Tag>;
  }
  if (variant === "stamp") {
    return <Tag className={`lbl lbl-stamp ${light} ${className}`}>{children}</Tag>;
  }
  const auto = n === undefined;
  const num = typeof n === "number" ? String(n).padStart(2, "0") : n;
  return (
    <Tag className={`lbl lbl-ledger ${auto ? "lbl-auto" : ""} ${light} ${className}`}>
      {n !== false && (
        <>
          <span className="lbl-no">{auto ? null : num}</span>
          <span aria-hidden="true" className="lbl-dash">
            /
          </span>
        </>
      )}
      <span>{children}</span>
      <span aria-hidden="true" className="lbl-rule" />
    </Tag>
  );
}

/** Section kicker (eyebrow). Now a ledger entry: "04 / Proof, not theory". Same props as before + optional `n`. */
export function Kicker({
  children,
  tone = "ink",
  className = "",
  n,
}: {
  children: ReactNode;
  tone?: "ink" | "light";
  className?: string;
  n?: string | number | false;
}) {
  return (
    <Label tone={tone} n={n} className={className}>
      {children}
    </Label>
  );
}

/**
 * Section heading block: ledger kicker + serif h2 (+ optional italic tail) + lead.
 * String titles rise line-by-line into view (RiseText); ReactNode titles render as given.
 */
export function SectionHead({
  kicker,
  title,
  titleEm,
  lead,
  tone = "ink",
  align = "left",
  id,
  n,
  className = "",
}: {
  kicker: string;
  title: ReactNode;
  titleEm?: ReactNode;
  lead?: ReactNode;
  tone?: "ink" | "light";
  align?: "left" | "center";
  id?: string;
  /** Force the kicker number ("03") or hide it (false). Default: automatic page order. */
  n?: string | number | false;
  className?: string;
}) {
  const center = align === "center";
  const emClass = tone === "light" ? "text-gold" : "text-violet-deep";
  const canRise = typeof title === "string" && (titleEm === undefined || typeof titleEm === "string");
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      <Kicker tone={tone} n={n}>
        {kicker}
      </Kicker>
      <h2
        id={id}
        className={`mt-3 font-serif text-[clamp(2.25rem,5.2vw,4rem)] leading-[1.02] tracking-[-0.015em] ${
          tone === "light" ? "text-white" : "text-ink"
        }`}
      >
        {canRise ? (
          <RiseText
            segments={[{ t: title as string }, ...(titleEm ? [{ t: ` ${titleEm as string}`, em: true }] : [])]}
            emClassName={emClass}
          />
        ) : (
          <>
            {title}
            {titleEm ? (
              <>
                {" "}
                <em className={emClass}>{titleEm}</em>
              </>
            ) : null}
          </>
        )}
      </h2>
      {lead ? (
        <p className={`mt-4 text-[1.0625rem] leading-relaxed md:text-lg ${tone === "light" ? "text-mist" : "text-ink-2"} ${center ? "mx-auto" : ""} max-w-2xl`}>
          {lead}
        </p>
      ) : null}
    </div>
  );
}

const PRICE_TAIL = /^(.*?)\s*[·•|–-]\s*(₹\s?[\d,]+(?:\.\d+)?)\s*$/;

/**
 * The one CTA: an in-page link to the checkout (#join). A square-cut saffron ticket:
 * label + hand-drawn arrow, a dotted perforation, and the price in a stamped stub.
 * The price is taken from `price`, or split automatically from children like "Register · ₹99".
 * `price={false}` = no stub. Hover: the arrow draws further. Press: the face stamps down onto its plate.
 * Pass layout classes (e.g. "w-full sm:w-auto") via className.
 */
export function CtaLink({
  children,
  size = "md",
  className = "",
  href = "#join",
  price,
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
  price?: string | false;
}) {
  let label: ReactNode = children;
  let stub: string | undefined = price === false ? undefined : price;
  if (price === undefined && typeof children === "string") {
    const m = PRICE_TAIL.exec(children);
    if (m) {
      label = m[1];
      stub = m[2];
    }
  }
  return (
    <a href={href} className={`cta cta-${size} ${stub ? "cta-has-stub" : ""} ${className}`}>
      <span aria-hidden="true" className="cta-plate cta-shape" />
      <span className="cta-face cta-shape">
        <span className="cta-label">{label}</span>
        <ThreadArrow className="cta-arrow" />
        {stub && (
          <>
            <span aria-hidden="true" className="cta-perf" />
            <span className="cta-stub">
              <span className="cta-price">{stub}</span>
            </span>
          </>
        )}
      </span>
    </a>
  );
}

/**
 * Secondary text link: quiet hairline underline that is re-drawn as a wavy saffron thread on hover/focus.
 * Use for "See who's teaching", "Read the refund policy", back-links, etc. (≥44px tap height).
 */
export function TextLink({
  href,
  children,
  className = "",
  arrow = false,
  external = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  arrow?: boolean;
  external?: boolean;
}) {
  return (
    <a href={href} className={`link-thread ${className}`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      <span className="lt-text">{children}</span>
      {arrow && <ThreadArrow className="lt-arrow" />}
    </a>
  );
}

/**
 * Specimen tag for a stat/credential: big serif value over a typed caption, on a paper tag with a
 * punched hole. Good for authority badges over images or in grids. `value` may be any node (e.g. <Odometer/>).
 */
export function SpecimenTag({
  value,
  caption,
  className = "",
  as = "div",
}: {
  value: ReactNode;
  caption: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag className={`tag ${className}`}>
      <span className="tag-v">{value}</span>
      <span className="tag-c">{caption}</span>
    </Tag>
  );
}

/** Ledger rule / divider. "double" = accountant's double rule, "single" = hairline, "dotted" = perforation. */
export function Rule({ variant = "single", className = "" }: { variant?: "single" | "double" | "dotted"; className?: string }) {
  return <div aria-hidden="true" className={`rule rule-${variant} ${className}`} />;
}

/**
 * Circular rubber postmark (decorative, aria-hidden): text set around a ring + a centre value.
 * Give it a size via className (e.g. "size-24"). Safe to use several times per page (unique ring ids).
 */
export function Postmark({
  ring,
  center,
  sub,
  className = "",
  pathId,
}: {
  ring: string;
  center: string;
  sub?: string;
  className?: string;
  /** Optional explicit id for the ring path (auto-generated and unique by default). */
  pathId?: string;
}) {
  const autoId = `pm-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ringId = pathId ?? autoId;
  return (
    <svg viewBox="0 0 120 120" className={`postmark ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <path id={ringId} d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
      </defs>
      <circle cx="60" cy="60" r="56" className="pm-disc" />
      <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fill="currentColor" fontSize="9.4" letterSpacing="2.1" className="font-mono" fontWeight={600}>
        <textPath href={`#${ringId}`}>{ring}</textPath>
      </text>
      <text x="60" y={sub ? 63 : 67} textAnchor="middle" fill="currentColor" fontSize="21" fontWeight={700} className="font-mono">
        {center}
      </text>
      {sub && (
        <text x="60" y="78" textAnchor="middle" fill="currentColor" fontSize="7.4" letterSpacing="1.6" className="font-mono" fontWeight={600}>
          {sub}
        </text>
      )}
    </svg>
  );
}
