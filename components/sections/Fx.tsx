"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { ArrowRight } from "../icons";

/*
 * Section-level effect helpers (owned by the sections agent). All the actual motion lives in
 * app/sections.css and is keyed off `data-fx`:
 *   idle  → server render, no JS, reduced motion, or already on screen at mount: final state, no animation.
 *   armed → below the fold after mount: pre-state (unstamped, unstruck, undrawn).
 *   in    → scrolled into view once: CSS plays the effect a single time.
 * So content is never hidden without JS, and reduced-motion users never see movement.
 */

type FxState = "idle" | "armed" | "in";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Fx({
  as = "div",
  className,
  style,
  children,
  id,
  labelledBy,
}: {
  as?: "div" | "section" | "ol" | "ul" | "li" | "figure" | "span" | "article" | "dl";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  id?: string;
  labelledBy?: string;
}) {
  const Tag = as as ElementType;
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<FxState>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    // Already (partly) on screen at mount: leave it static rather than flash it away and back.
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setState("armed");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -14% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} id={id} aria-labelledby={labelledBy} data-fx={state} className={className} style={style}>
      {children}
    </Tag>
  );
}

/**
 * Swipeable deck (CSS scroll-snap) below `lg`, plain list from `lg` up (the CSS turns it into a sticky pile).
 * The only JS is the "01 / 06" counter and the prev/next buttons.
 */
export function Deck({
  children,
  count,
  label,
  className = "",
  itemLabel = "card",
}: {
  children: ReactNode;
  count: number;
  label: string;
  className?: string;
  itemLabel?: string;
}) {
  const ref = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(el.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(items.indexOf(e.target as HTMLElement));
      },
      { root: el, threshold: 0.6 },
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, []);

  function go(step: number) {
    const el = ref.current;
    if (!el) return;
    const next = Math.min(count - 1, Math.max(0, active + step));
    const item = el.children[next] as HTMLElement | undefined;
    if (!item) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    el.scrollTo({ left: item.offsetLeft - pad, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <ol ref={ref} aria-label={label} className={className}>
        {children}
      </ol>
      <div className="fj-deck-ctrl lg:hidden">
        <button type="button" onClick={() => go(-1)} disabled={active === 0} aria-label={`Previous ${itemLabel}`} className="fj-deck-btn">
          <ArrowRight className="size-4 rotate-180" />
        </button>
        <p aria-hidden="true" className="fj-deck-count">
          <span className="text-ink">{pad(active + 1)}</span>
          <span className="fj-deck-bar">
            <span style={{ transform: `scaleX(${(active + 1) / count})` }} />
          </span>
          <span>{pad(count)}</span>
        </p>
        <button type="button" onClick={() => go(1)} disabled={active >= count - 1} aria-label={`Next ${itemLabel}`} className="fj-deck-btn">
          <ArrowRight className="size-4" />
        </button>
      </div>
    </>
  );
}
