"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mobile swipe carousel (CSS scroll-snap) that becomes a normal grid from `md` up.
 * The only JS is the little progress indicator.
 */
export function SnapCarousel({ children, count, className = "", label }: { children: ReactNode; count: number; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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

  return (
    <>
      <div ref={ref} role="list" aria-label={label} className={className}>
        {children}
      </div>
      {/* Ledger ticks + a typed counter ("03 / 06") instead of pill dots. */}
      <div aria-hidden="true" className="mt-5 flex items-center justify-center gap-3 md:hidden">
        <span className="flex items-end gap-1">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={`w-[3px] transition-[height,background-color] duration-300 ease-soft ${i === active ? "h-4 bg-saffron-deep" : "h-2 bg-ink-2/30"}`}
            />
          ))}
        </span>
        <span className="font-mono text-[0.68rem] font-medium tracking-[0.08em] text-ink-2 tabular-nums">
          {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
      </div>
    </>
  );
}
