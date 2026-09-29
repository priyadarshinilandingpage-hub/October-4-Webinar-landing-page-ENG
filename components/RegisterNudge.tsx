"use client";

import { useEffect, useRef, useState } from "react";
import { Countdown } from "./Countdown";
import { BONUSES, EVENT, MODULES, NUDGE } from "./content";
import { SeatsLeft } from "./Seats";
import { ByLang, PriceTag } from "./ui";

const KEY = "nudge-seen";

/**
 * The "don't miss it" lightbox (Shyam, 30 Sep 2026): once per visit, it sums up what the seat holds, shows the
 * total value struck out next to the ₹99, the real countdown and (when a real seat limit is set) the real seats
 * left, with a close button and a "No thanks". It opens after NUDGE.delayMs on the page, or earlier on desktop when
 * the pointer leaves through the top (exit intent). Never while the payment form is on screen or being filled,
 * never over the video, never twice in one visit. Nothing is rendered until it opens.
 */
export function RegisterNudge() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {}
    const join = document.getElementById("join");
    let joinVisible = false;
    const io = join ? new IntersectionObserver(([e]) => (joinVisible = e.isIntersecting), { threshold: 0.15 }) : null;
    if (join && io) io.observe(join);

    const blocked = () =>
      joinVisible ||
      document.querySelector(".vs-overlay") !== null ||
      (document.activeElement instanceof HTMLInputElement && Boolean(document.activeElement.closest("#join")));

    let done = false;
    let timer = 0;
    const armedAt = Date.now() + 8000;
    function cleanup() {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onLeave);
      io?.disconnect();
    }
    function show() {
      if (done || blocked()) return false;
      done = true;
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      lastFocus.current = document.activeElement;
      setOpen(true);
      cleanup();
      return true;
    }
    // Desktop exit intent: the pointer leaves the window through the top edge (after a short grace period).
    function onLeave(e: MouseEvent) {
      if (e.relatedTarget === null && e.clientY <= 0 && Date.now() > armedAt) show();
    }
    // Timer: try at the delay, then every few seconds until it can show without interrupting.
    const tick = () => {
      if (!show()) timer = window.setTimeout(tick, 4000);
    };
    timer = window.setTimeout(tick, NUDGE.delayMs);
    document.addEventListener("mouseout", onLeave);
    return cleanup;
  }, []);

  // Closing (X, No thanks, backdrop or Esc) puts the keyboard focus back where it was before the popup opened.
  const close = () => {
    setOpen(false);
    if (lastFocus.current instanceof HTMLElement) lastFocus.current.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const register = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    const join = document.getElementById("join");
    join?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const input = join?.querySelector<HTMLInputElement>("input[name=name]");
      input?.focus({ preventScroll: true });
    }, 700);
  };

  if (!open) return null;
  return (
    <div className="nudge" role="dialog" aria-modal="true" aria-labelledby="nudge-title">
      <div className="nudge-backdrop" onClick={close} />
      <div className="nudge-card light-island">
        <button ref={closeRef} type="button" className="nudge-x" onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        <p className="lbl pr-10 text-saffron-deep">{NUDGE.kicker}</p>
        <h2 id="nudge-title" className="mt-2 pr-8 font-serif text-[clamp(1.6rem,5.4vw,2.2rem)] leading-[1.08] tracking-[-0.015em] text-ink">
          <ByLang ta={NUDGE.title} en={NUDGE.titleEn} />
        </h2>

        <ul className="nudge-list">
          <li>{NUDGE.modules(MODULES.items.length)}</li>
          {BONUSES.map((b) => (
            <li key={b.label}>{b.label}</li>
          ))}
          <li>{NUDGE.live}</li>
        </ul>

        <div className="nudge-price">
          <p className="fj-mono text-[0.72rem] text-ink-2">{NUDGE.totalLabel}</p>
          <PriceTag size="xl" />
        </div>

        <SeatsLeft className="mt-3" />
        <Countdown label={NUDGE.countdownLabel} className="mt-3" />

        <a href="#join" onClick={register} className="btn btn-saffron nudge-cta">
          <span>
            <ByLang ta={NUDGE.cta} en={NUDGE.ctaEn} /> · {EVENT.price}
          </span>
        </a>
        <p className="mt-2 text-center text-[0.8rem] text-ink-2">{NUDGE.refund}</p>
        <button type="button" onClick={close} className="nudge-no">
          <ByLang ta={NUDGE.no} en={NUDGE.noEn} />
        </button>
      </div>
    </div>
  );
}
