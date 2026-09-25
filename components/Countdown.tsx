"use client";

import { useEffect, useState } from "react";
import { OFFER } from "@/lib/offer";
import { EVENT } from "./content";

const START = Date.parse(OFFER.startsAtIso);
const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000; // treat the first 3 h after start as "live now"

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n: number) => String(n).padStart(2, "0");

type Variant = "inline" | "blocks" | "dark";

/**
 * Real countdown to OFFER.startsAtIso (no fake timers).
 * Hydration-safe: the server and first client render show "--"; the clock starts after mount.
 */
export function Countdown({ variant = "inline", label, className = "" }: { variant?: Variant; label?: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const srText = `Starts ${EVENT.dateLabel}, ${EVENT.timeLabel}`;

  if (now !== null && now >= START) {
    const live = now < START + LIVE_WINDOW_MS;
    return (
      <p className={`inline-flex items-center gap-2 text-sm font-semibold ${variant === "dark" ? "text-gold" : "text-saffron-deep"} ${className}`}>
        {live && <span className="live-dot" aria-hidden="true" />}
        {live ? "We're live right now" : "This session has ended"}
      </p>
    );
  }

  const p = now === null ? null : parts(START - now);
  const units: [string, string][] = [
    [p ? pad(p.d) : "--", "days"],
    [p ? pad(p.h) : "--", "hrs"],
    [p ? pad(p.m) : "--", "min"],
    [p ? pad(p.s) : "--", "sec"],
  ];

  if (variant === "inline") {
    return (
      <p className={`inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 ${className}`}>
        <span className="sr-only">{srText}</span>
        {label && (
          <span aria-hidden="true" className="lbl inline-flex items-center gap-2 text-ink-2">
            <span className="live-dot" />
            {label}
          </span>
        )}
        <span aria-hidden="true" className="font-mono text-[0.95rem] font-medium tabular-nums text-ink">
          {units.map(([v, u], i) => (
            <span key={u}>
              {v}
              <span className="ml-px text-[0.72em] text-ink-2">{u[0]}</span>
              {i < units.length - 1 && <span className="mx-1.5 text-saffron-deep/70">:</span>}
            </span>
          ))}
        </span>
      </p>
    );
  }

  // Ledger cells: square boxes, typed numerals. "dark" = on the plum band.
  const dark = variant === "dark";
  return (
    <div className={className}>
      <span className="sr-only">{srText}</span>
      {label && (
        <p aria-hidden="true" className={`lbl mb-3 ${dark ? "text-mist" : "text-ink-2"}`}>
          {label}
        </p>
      )}
      <div aria-hidden="true" className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {units.map(([v, u]) => (
          <div
            key={u}
            className={`px-2 pt-2.5 pb-2 text-center ${
              dark ? "border border-[rgb(255_255_255/0.16)] bg-[rgb(255_255_255/0.05)]" : "border border-line bg-paper shadow-plate"
            }`}
          >
            <div className={`font-mono text-[1.6rem] leading-none font-medium tracking-[-0.03em] tabular-nums sm:text-[1.9rem] ${dark ? "text-gold" : "text-saffron-deep"}`}>
              {v}
            </div>
            <div className={`mt-2 border-t pt-1.5 font-mono text-[0.6rem] font-medium tracking-[0.14em] uppercase ${dark ? "border-[rgb(255_255_255/0.14)] text-mist" : "border-line text-ink-2"}`}>
              {u}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
