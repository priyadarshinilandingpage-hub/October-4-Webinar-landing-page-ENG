"use client";

import { useEffect, useState } from "react";
import { OFFER } from "@/lib/offer";
import { EVENT, VALUE_LABEL } from "./content";

const KEY = "toast-seen";
const START = Date.parse(OFFER.startsAtIso);
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Slides in 3 s after landing (Shyam, 30 Sep 2026), once per visit: the live date, the real countdown, the value
 * against the price, and a pulsing Register button. Everything in it is true. Closes with ✕, on Register, or by
 * itself once the payment form comes on screen. Transform/opacity only.
 */
export function LandingToast() {
  const [show, setShow] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {}
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      setShow(true);
    }, 3000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!show) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    const join = document.getElementById("join");
    const io = join ? new IntersectionObserver(([e]) => e.isIntersecting && setShow(false), { threshold: 0.2 }) : null;
    if (join && io) io.observe(join);
    return () => {
      window.clearInterval(id);
      io?.disconnect();
    };
  }, [show]);

  // public/boot.js scrolls to the form; once it has arrived, the cursor goes to the Name field.
  const register = () => {
    setShow(false);
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>("#join input[name=name]")?.focus({ preventScroll: true });
    }, 700);
  };

  if (!show) return null;
  const s = Math.max(0, Math.floor((START - now) / 1000));
  const time = `${Math.floor(s / 86400)}d ${pad(Math.floor((s % 86400) / 3600))}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
  return (
    <aside className="toast" role="status" aria-label="Webinar reminder">
      <button type="button" className="toast-x" onClick={() => setShow(false)} aria-label="Close">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
      <p className="toast-top">
        <span className="live-dot" aria-hidden="true" /> Live this {EVENT.shortDate.split(",")[0]}, {EVENT.timeLabel}
      </p>
      <p className="toast-time">
        Starts in <strong>{time}</strong>
      </p>
      <p className="toast-price">
        <s>{VALUE_LABEL}</s> <strong>{EVENT.price}</strong> <span>today</span>
      </p>
      <a href="#join" className="toast-cta" onClick={register}>
        <span aria-hidden="true" className="toast-ring" />
        Register now →
      </a>
    </aside>
  );
}
