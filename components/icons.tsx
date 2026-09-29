// Small inline SVG icons (decorative: aria-hidden). Stroke icons inherit currentColor.
import type { CSSProperties } from "react";

type P = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ArrowRight({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
export function ArrowUp({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
export function Lock({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}
export function Check({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke} strokeWidth={2.4}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
export function Cross({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke} strokeWidth={2.2}>
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}
export function Plus({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke} strokeWidth={2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function Calendar({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
export function Clock({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
export function Globe({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z" />
    </svg>
  );
}
export function Chat({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M4.5 18.5l1.2-3.6A7.5 7.5 0 1 1 9 18.6z" />
      <path d="M9 11h6M9 14h3.5" />
    </svg>
  );
}
export function User({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </svg>
  );
}
export function Play({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8 5.8v12.4a1 1 0 0 0 1.5.86l10-6.2a1 1 0 0 0 0-1.72l-10-6.2A1 1 0 0 0 8 5.8z" />
    </svg>
  );
}
export function ImageIcon({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M20.5 15.5l-4.5-4.5-8 8" />
    </svg>
  );
}
export function VideoIcon({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <rect x="3" y="6" width="13" height="12" rx="3" />
      <path d="M16 10.5l5-3v9l-5-3" />
    </svg>
  );
}
export function Sparkle({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2.5c.5 4.6 2.4 6.9 7 7.5v.9c-4.6.6-6.5 2.9-7 7.6h-.9c-.6-4.7-2.5-7-7.1-7.6V10c4.6-.6 6.5-2.9 7.1-7.5z" />
    </svg>
  );
}
export function Award({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" />
    </svg>
  );
}

/**
 * Hand-drawn arrow used inside CTAs: a slightly wobbly shaft + loose chevron.
 * The `.shaft` / `.head` parts are animated by CSS (globals.css → .cta / .btn):
 * the shaft draws further and the head slides out on hover.
 */
export function ThreadArrow({ className = "w-7 h-3" }: P) {
  return (
    <svg viewBox="0 0 40 14" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path className="shaft" pathLength={1} d="M1.5 7.6C8.5 5.9 15.8 9.1 23.4 7.1S33.6 6.3 38.2 7" />
      <path className="head" d="M32.6 2.6c1.9 1.7 3.8 3.1 5.8 4.4-2.1 1.2-3.9 2.7-5.6 4.8" />
    </svg>
  );
}

/** Cross-stitch mark (the saffron thread "stitched" through the ledger). Inherits currentColor. */
export function Stitch({ className = "size-3" }: P) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <path d="M2.6 2.8l6.8 6.6M9.3 2.6L2.7 9.4" />
    </svg>
  );
}

/**
 * Crocus that blooms once: petals rotate open from a closed bud, then the red stigmas draw in.
 * Pure CSS (see `.bloom` in globals.css), so it plays at first paint without waiting for JS,
 * and renders fully open under prefers-reduced-motion.
 */
export function CrocusBloom({ className = "size-8" }: P) {
  const petals: { r: number; fill: string; k: number }[] = [
    { r: -24, fill: "#b3a4dc", k: 0 },
    { r: 24, fill: "#a595d4", k: 1 },
    { r: -50, fill: "#8b7bbb", k: 2 },
    { r: 50, fill: "#7f6fb4", k: 3 },
    { r: 0, fill: "#6e5ea6", k: 4 },
  ];
  return (
    <svg viewBox="0 0 40 40" className={`bloom ${className}`} aria-hidden="true">
      <path d="M20 38.5V28" stroke="#6d5bb0" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M20 35.5c-3.4-.5-5.6-2.6-6.6-5.7 3.3.2 5.6 2.1 6.6 5.7z" fill="#9d8fd6" />
      <path d="M20 34c3-.6 5-2.5 5.9-5.3-3 .3-5 2-5.9 5.3z" fill="#8b7cc8" />
      {petals.map((p) => (
        <path
          key={p.k}
          className="petal"
          style={{ "--r": `${p.r}deg`, "--k": p.k } as CSSProperties}
          d="M20 28.5c-4.6-5.2-4.9-12.4 0-19.5 4.9 7.1 4.6 14.3 0 19.5z"
          fill={p.fill}
        />
      ))}
      <g className="stig" fill="none" stroke="#6d28d9" strokeWidth="1.4" strokeLinecap="round">
        <path pathLength={1} d="M20 26.5c-.9-3.6-2.2-6.4-4-8.6" />
        <path pathLength={1} d="M20 26.5c0-3.7.1-6.8.3-9.6" />
        <path pathLength={1} d="M20 26.5c.9-3.4 2.3-6.2 4.1-8.3" />
      </g>
      <g className="anth" fill="#a78bfa">
        <circle cx="15.9" cy="17.6" r="1.05" />
        <circle cx="20.3" cy="16.6" r="1.05" />
        <circle cx="24.2" cy="17.4" r="1.05" />
      </g>
    </svg>
  );
}

/** Botanical line drawing (plate illustration for media placeholders). Stroke = currentColor, stigmas = thread colour. */
export function CrocusSketch({ className = "w-20" }: P) {
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M60 156V92" />
      <path d="M60 150c-10-2-18-12-22-34 12 5 19 16 22 34zM60 146c9-3 16-12 19-30-11 5-17 14-19 30z" />
      <path d="M60 96C44 82 38 58 48 30c10 20 15 44 12 66z" />
      <path d="M60 96c16-14 22-38 12-66-10 20-15 44-12 66z" />
      <path d="M60 97C52 72 53 44 60 18c7 26 8 54 0 79z" />
      <path d="M50 44c3 10 6 24 8 40M70 44c-3 10-6 24-8 40" strokeDasharray="1.5 3" />
      <g stroke="var(--color-thread, #6d28d9)" strokeWidth={1.5}>
        <path d="M60 90c-2-12-6-22-12-30M60 90c0-13 0-24 1-34M60 90c2-12 6-21 11-29" />
      </g>
      <path d="M22 156h76" strokeDasharray="2 4" />
    </svg>
  );
}

/** Brand glyph: a small crocus (violet petals, saffron-red stigmas). */
export function Crocus({ className = "size-6" }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 29.5V20" stroke="#6d5bb0" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M16 26c-2.6-.4-4.4-2-5.2-4.4 2.6.1 4.4 1.6 5.2 4.4z" fill="#9d8fd6" />
      <path d="M16 21c-4.8-1.4-7.6-5.5-7-11.4 3.9 1.9 6.3 5.8 7 11.4z" fill="#9b8cc6" />
      <path d="M16 21c4.8-1.4 7.6-5.5 7-11.4-3.9 1.9-6.3 5.8-7 11.4z" fill="#8b7bbb" />
      <path d="M16 21.2c-3.1-3.3-3.6-9.3 0-16.2 3.6 6.9 3.1 12.9 0 16.2z" fill="#7b6ba8" />
      <path d="M16 18.5c-.4-2.6-1.4-4.8-3-6.6M16 18.5c0-2.8.1-5.3.2-7.6M16 18.5c.5-2.5 1.6-4.6 3.2-6.3" stroke="#6d28d9" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="13" cy="11.8" r="1" fill="#a78bfa" />
      <circle cx="16.2" cy="10.8" r="1" fill="#a78bfa" />
      <circle cx="19.2" cy="12.1" r="1" fill="#a78bfa" />
    </svg>
  );
}
