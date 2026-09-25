"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ReviewShot = { src: string; alt: string; width: number; height: number };

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Full-screen viewer for the review screenshots, in the same style as the video spotlight: the tapped
 * print lifts off the page and grows into a centred frame on a plum card. Close (✕, Esc, backdrop),
 * previous / next (buttons, arrow keys, swipe), "2 / 5" counter. Transform/opacity animation only.
 *
 * Triggers: any element inside `scopeSelector` with `data-review-index="N"` (make it a <button> so it's
 * keyboard-reachable). One listener for the whole wall (event delegation).
 */
export function ReviewLightbox({ items, scopeSelector = "#reviews" }: { items: ReviewShot[]; scopeSelector?: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<"in" | "shown" | "out">("in");
  const [mounted, setMounted] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const originRef = useRef<HTMLElement | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const flipFrom = useCallback((el: HTMLElement | null) => {
    const f = frameRef.current;
    if (!el || !f) return "none";
    const t = el.getBoundingClientRect();
    const r = f.getBoundingClientRect();
    return `translate(${t.left - r.left}px, ${t.top - r.top}px) scale(${t.width / r.width}, ${t.height / r.height})`;
  }, []);

  // Open from any trigger in the wall.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>(`${scopeSelector} [data-review-index]`);
      if (!trigger) return;
      const i = Number(trigger.dataset.reviewIndex);
      if (!Number.isInteger(i) || !items[i]) return;
      e.preventDefault();
      originRef.current = trigger;
      setPhase("in");
      setIndex(i);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [items, scopeSelector]);

  // Opening animation (FLIP from the tapped print).
  useLayoutEffect(() => {
    if (index === null || phase !== "in") return;
    const f = frameRef.current;
    if (!f) return;
    document.documentElement.classList.add("vs-lock");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      f.style.transition = "none";
      f.style.transform = flipFrom(originRef.current);
      f.getBoundingClientRect();
      f.style.transition = `transform 560ms ${EASE}`;
      f.style.transform = "none";
    }
    const id = requestAnimationFrame(() => setPhase("shown"));
    closeRef.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(id);
  }, [index, phase, flipFrom]);

  const close = useCallback(() => {
    if (index === null) return;
    const f = frameRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Land back on the print that matches the screenshot now showing (it may have changed via next/prev).
    const target = document.querySelector<HTMLElement>(`${scopeSelector} [data-review-index="${index}"]`) ?? originRef.current;
    setPhase("out");
    if (f && !reduce) {
      f.style.transition = `transform 440ms ${EASE}`;
      f.style.transform = flipFrom(target);
    }
    window.setTimeout(
      () => {
        setIndex(null);
        setPhase("in");
        document.documentElement.classList.remove("vs-lock");
        target?.focus({ preventScroll: true });
      },
      reduce ? 120 : 440,
    );
  }, [index, flipFrom, scopeSelector]);

  const go = useCallback(
    (step: number) => setIndex((i) => (i === null ? i : (i + step + items.length) % items.length)),
    [items.length],
  );

  // Keyboard: Esc closes, arrows navigate.
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, go]);

  // Preload the neighbours so next/previous is instant.
  useEffect(() => {
    if (index === null) return;
    for (const d of [1, -1]) {
      const it = items[(index + d + items.length) % items.length];
      if (it) new Image().src = it.src;
    }
  }, [index, items]);

  if (!mounted || index === null) return null;
  const it = items[index];

  return createPortal(
    <div className={`vs-overlay rl is-${phase}`} role="dialog" aria-modal="true" aria-label={`Review screenshot ${index + 1} of ${items.length}`}>
      <div className="vs-backdrop" onClick={close} />
      <div className="vs-card rl-card">
        <span aria-hidden="true" className="vs-card-art" />
        <div
          ref={frameRef}
          className="rl-frame"
          style={{ aspectRatio: `${it.width} / ${it.height}` }}
          onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
          }}
        >
          <img key={it.src} src={it.src} alt={it.alt} width={it.width} height={it.height} className="rl-img" draggable={false} />
          <div className="vs-top">
            <span className="vs-badge">
              Review {index + 1} / {items.length}
            </span>
            <button ref={closeRef} type="button" onClick={close} className="vs-btn" aria-label="Close">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        {items.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="vs-btn rl-nav rl-prev" aria-label="Previous review">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" onClick={() => go(1)} className="vs-btn rl-nav rl-next" aria-label="Next review">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
