"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckoutForm } from "@/components/CheckoutForm";
import { OFFER } from "@/lib/offer";

/** Every "Reserve my seat" button opens the one registration pop-up through this event (no form section on the page). */
const OPEN = "open-register";
const u = (s: string) => s.split(" ").map((c) => `u-${c}`).join(" ");

export function RegisterButton({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <button type="button" id={id} className={className} onClick={() => window.dispatchEvent(new Event(OPEN))}>
      {children}
    </button>
  );
}

declare global {
  interface Window {
    /** Set by public/boot.js when the page was opened at /#join (the thank-you page's "Try again"). */
    __openRegister?: boolean;
  }
}

/**
 * The registration pop-up: price, the real checkout form (Razorpay), the 3 steps. Esc, ✕ and the backdrop close it;
 * focus goes to the name field on open and back to the button that opened it on close.
 */
export function RegisterModal({ head, steps }: { head: ReactNode; steps: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement;
      setOpen(true);
    };
    window.addEventListener(OPEN, show);
    if (window.__openRegister) {
      window.__openRegister = false;
      show();
    }
    return () => window.removeEventListener(OPEN, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const t = window.setTimeout(() => box.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Keep Tab inside the pop-up.
      if (e.key === "Tab" && box.current) {
        const f = box.current.querySelectorAll<HTMLElement>("button, a[href], input, [tabindex]:not([tabindex='-1'])");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last?.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first?.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return (
    <div className={u("modal")} data-open={open ? "" : undefined} aria-hidden={!open} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div ref={box} className={u("modal-box")} role="dialog" aria-modal="true" aria-labelledby="register-title" inert={!open}>
        <button type="button" className={u("modal-x")} aria-label="Close" onClick={() => setOpen(false)}>
          ✕
        </button>
        {head}
        <CheckoutForm />
        {steps}
      </div>
    </div>
  );
}

const START = Date.parse(OFFER.startsAtIso);
const pad = (n: number) => String(n).padStart(2, "0");

/** Real countdown to OFFER.startsAtIso. Shows "--" until the page is running in the browser. */
export function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  const s = now === null ? null : Math.max(0, Math.floor((START - now) / 1000));
  const cells: [string, string][] =
    s === 0
      ? [["Live", "now"]]
      : [
          [s === null ? "--" : pad(Math.floor(s / 86400)), "Days"],
          [s === null ? "--" : pad(Math.floor((s % 86400) / 3600)), "Hrs"],
          [s === null ? "--" : pad(Math.floor((s % 3600) / 60)), "Min"],
          [s === null ? "--" : pad(s % 60), "Sec"],
        ];
  return (
    <div className={u("cells")} role="timer" aria-label={`Starts ${OFFER.dateLabel}`}>
      {cells.map(([v, l]) => (
        <span key={l}>
          <b>{v}</b>
          <small>{l}</small>
        </span>
      ))}
    </div>
  );
}

/** Bottom bar: shows once the hero button has scrolled out of view. */
export function StickyBar({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero-cta");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setOn(!e!.isIntersecting && e!.boundingClientRect.top < 0));
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return (
    <div className={`${u("bar")} ${on ? "u-on" : ""}`} aria-hidden={!on} inert={!on}>
      {children}
    </div>
  );
}

/** Her intro video: only the poster loads; the 37 s clip (with sound) loads when someone taps play. */
export function VideoTap({ src, poster, label }: { src: string; poster: ReactNode; label: string }) {
  const [play, setPlay] = useState(false);
  if (play) return <video src={src} controls playsInline autoPlay aria-label={label} />;
  return (
    <>
      {poster}
      <button className={u("play")} type="button" aria-label="Play the video" onClick={() => setPlay(true)}>
        <span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
          </svg>
        </span>
        <small>Hear it from her</small>
      </button>
    </>
  );
}

/** Previous / next arrows for the review row (the row itself scrolls by swipe too). */
export function TrackArrows() {
  const go = (dir: number) => {
    const t = document.getElementById("track");
    t?.scrollBy({ left: dir * t.clientWidth * 0.7, behavior: "smooth" });
  };
  const arrow = (d: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  return (
    <>
      <button className={u("arrow prev")} type="button" aria-label="Previous review" onClick={() => go(-1)}>
        {arrow("M15 5l-7 7 7 7")}
      </button>
      <button className={u("arrow next")} type="button" aria-label="Next review" onClick={() => go(1)}>
        {arrow("M9 5l7 7-7 7")}
      </button>
    </>
  );
}
