"use client";

import { useEffect } from "react";

/** How long the hero (her photo + credentials) stays on screen before the page moves to the payment card. */
const AUTHORITY_MS = 2200;
const SEEN_KEY = "as-join";
/** The final glide: short enough to stay smooth on any phone. */
const GLIDE_PX = 520;
const GLIDE_MS = 750;
const FADE_MS = 200;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Every visitor (phone and desktop) first sees the hero's proof, then the page moves to #join (₹99 form).
 * Scrolling ~7,000 px smoothly repaints every section, video and animation on the way and stutters on
 * budget phones, so instead: a soft curtain fades in (200 ms), the page jumps to just above the form while
 * hidden, the curtain fades out, and a short eased glide (~520 px) lands on the form. Cheap everywhere.
 * - Cancelled the moment the visitor scrolls, swipes, clicks, or presses a key: we never fight the user.
 * - Runs once per browser session, so coming back from the payment page doesn't jump again.
 * - Skipped when the address targeted a section (/#join, /#faq…): public/boot.js removes it from the address,
 *   opens the page there and marks <html data-jump>.
 */
export function AdAutoScroll({ targetId = "join" }: { targetId?: string }) {
  useEffect(() => {
    if (document.documentElement.dataset.jump || window.location.hash) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {}

    const root = document.documentElement;
    const startY = window.scrollY;
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    const timers: number[] = [];
    let raf = 0;
    let userActed = false;
    let moving = false;
    let curtain: HTMLDivElement | null = null;

    const removeCurtain = () => {
      curtain?.remove();
      curtain = null;
    };
    const stop = () => {
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(raf);
      events.forEach((e) => window.removeEventListener(e, onUser));
      window.removeEventListener("scroll", onScroll);
      delete root.dataset.autoscroll;
      removeCurtain();
    };
    function onUser() {
      userActed = true;
      stop();
    }
    // Before we move: the visitor's own scrolling (or scroll restoration) means they're already exploring.
    function onScroll() {
      if (!moving && Math.abs(window.scrollY - startY) > 40) onUser();
    }
    const jump = (top: number) => window.scrollTo({ top, behavior: "instant" });

    events.forEach((e) => window.addEventListener(e, onUser, { passive: true }));
    window.addEventListener("scroll", onScroll, { passive: true });

    timers.push(
      window.setTimeout(() => {
        const el = document.getElementById(targetId);
        if (!el || userActed) return stop();
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {}

        const bar = parseFloat(getComputedStyle(root).getPropertyValue("--topbar-h")) || 60;
        const target = () => Math.max(0, el.getBoundingClientRect().top + window.scrollY - bar - 8);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        moving = true;
        root.dataset.autoscroll = "1"; // lets other effects (e.g. the video spotlight) stay out of the way

        if (reduce) {
          jump(target());
          return stop();
        }

        const glide = () => {
          const from = window.scrollY;
          const to = target();
          const t0 = performance.now();
          const step = (now: number) => {
            if (userActed) return;
            const t = Math.min(1, (now - t0) / GLIDE_MS);
            jump(from + (to - from) * easeOutCubic(t));
            if (t < 1) raf = requestAnimationFrame(step);
            else stop();
          };
          raf = requestAnimationFrame(step);
        };

        // Short distance: just glide.
        if (target() - window.scrollY <= GLIDE_PX * 1.6) return glide();

        // Long distance: soft curtain, jump while covered, reveal, then the short glide.
        curtain = document.createElement("div");
        curtain.setAttribute("aria-hidden", "true");
        curtain.className = "as-curtain";
        document.body.appendChild(curtain);
        requestAnimationFrame(() => curtain?.classList.add("is-on"));
        timers.push(
          window.setTimeout(() => {
            if (userActed) return;
            jump(target() - GLIDE_PX);
            curtain?.classList.remove("is-on");
            timers.push(window.setTimeout(removeCurtain, FADE_MS + 60));
            glide();
          }, FADE_MS),
        );
      }, AUTHORITY_MS),
    );

    return stop;
  }, [targetId]);
  return null;
}
