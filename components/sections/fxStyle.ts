import type { CSSProperties } from "react";

/**
 * Inline-style helper for the per-item stagger index that app/sections.css reads as var(--i).
 * Lives outside Fx.tsx ("use client") so server components can call it.
 */
export function idx(i: number, extra?: CSSProperties): CSSProperties {
  return { ["--i" as string]: i, ...extra } as CSSProperties;
}
