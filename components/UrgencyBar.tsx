"use client";

import { useEffect, useState } from "react";
import { OFFER } from "@/lib/offer";
import { VALUE_LABEL, EVENT } from "./content";

const START = Date.parse(OFFER.startsAtIso);
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The strip across the very top (inside the sticky header): the real start time counting down, and the value
 * against the price. Everything in it is true. Ticks once a second; only the digits change (cheap).
 */
export function UrgencyBar() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  const left = now === null ? null : Math.max(0, START - now);
  const s = left === null ? 0 : Math.floor(left / 1000);
  const time = left === null ? "--" : `${Math.floor(s / 86400)}d ${pad(Math.floor((s % 86400) / 3600))}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
  return (
    <a href="#join" className="urgency" aria-label={`Live ${EVENT.shortDate}, ${EVENT.timeLabel}. Book your seat for ${EVENT.price}`}>
      <span className="urgency-item">
        <span className="live-dot" aria-hidden="true" /> LIVE {EVENT.shortDate}, {EVENT.timeLabel}
      </span>
      <span className="urgency-item urgency-time">
        Starts in <strong>{time}</strong>
      </span>
      <span className="urgency-item urgency-price">
        <s>{VALUE_LABEL}</s> <strong>{EVENT.price}</strong>
      </span>
      <span className="urgency-go">Book now →</span>
    </a>
  );
}
