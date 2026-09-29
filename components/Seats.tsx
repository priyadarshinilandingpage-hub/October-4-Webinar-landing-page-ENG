"use client";

import { useEffect, useState } from "react";

/** Show the line only once it helps: a small number reads as "nobody is coming". */
const MIN_TO_SHOW = 20;

let request: Promise<number | null> | undefined;
/** One request per page view, shared by every place that shows the count. */
function loadBooked(): Promise<number | null> {
  request ??= fetch("/api/seats", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { enabled?: boolean; booked?: number } | null) => (d?.enabled && typeof d.booked === "number" ? d.booked : null))
    .catch(() => null);
  return request;
}

export function useBooked(): number | null {
  const [booked, setBooked] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    loadBooked().then((n) => alive && setBooked(n));
    return () => {
      alive = false;
    };
  }, []);
  return booked;
}

/**
 * "N people have already booked", counted on the server from real paid orders (server/routes/seats.ts).
 * Hidden until at least MIN_TO_SHOW people have booked, so it only ever shows a true, encouraging number.
 */
export function SeatsLeft({ className = "" }: { className?: string }) {
  const booked = useBooked();
  if (booked === null || booked < MIN_TO_SHOW) return null;
  return (
    <p className={`seats ${className}`}>
      <span className="live-dot" aria-hidden="true" />
      <span>
        <strong>{booked}</strong> people have already booked
      </span>
    </p>
  );
}
