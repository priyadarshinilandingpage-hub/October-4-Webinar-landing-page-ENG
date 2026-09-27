"use client";

import { useEffect } from "react";

/**
 * After the first screen has fully loaded, quietly fetches the rest of the page's lazy images (a few at a time,
 * top to bottom) so fast scrolling finds them ready. Images of the hidden theme are skipped, videos are not
 * touched (each one still loads only near the screen), and nothing happens when the visitor has asked their
 * browser to save data.
 */
export function WarmImages() {
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const timers: number[] = [];
    const warm = () => {
      const imgs = [...document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')].filter(
        (img) => img.getClientRects().length > 0, // skips display: none (the other theme's copies)
      );
      let i = 0;
      const next = () => {
        for (let k = 0; k < 3 && i < imgs.length; k++, i++) imgs[i]!.loading = "eager";
        if (i < imgs.length) timers.push(window.setTimeout(next, 300));
      };
      next();
    };
    const start = () => timers.push(window.setTimeout(warm, 1200));
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return null;
}
