"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  /** Still frame. Decorative loops get it from an image under the video (see Media); here it is only used for
   *  the native-controls player and for people who prefer reduced motion (no autoplay). */
  poster?: string;
  label: string;
  className?: string;
  /** Above the fold: fetch as soon as the page has loaded, without waiting to be scrolled near. */
  eager?: boolean;
  /** Real player with sound + controls (intro video). Decorative loops are muted + autoplay. */
  controls?: boolean;
};

/** Resolves once the page's own files are in (the load event) plus a short pause, so no video competes with
 *  the text, fonts and first images on a slow connection. */
let pageReady: Promise<void> | undefined;
function whenPageReady(): Promise<void> {
  pageReady ??= new Promise<void>((resolve) => {
    const settle = () => window.setTimeout(resolve, 600);
    if (document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });
  });
  return pageReady;
}

/**
 * At most this many decorative loops decode at once, page-wide (30 Sep 2026: several clips playing together
 * while scrolling was a main source of lag on phones and laptops). The most recently scrolled-in clips win;
 * the others pause and show their still image.
 */
const MAX_PLAYING = 2;
const wanting: HTMLVideoElement[] = [];
function syncPlayback() {
  const allowed = new Set(wanting.slice(-MAX_PLAYING));
  for (const v of wanting) {
    if (allowed.has(v)) {
      if (v.paused) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  }
}
function want(v: HTMLVideoElement, on: boolean) {
  const i = wanting.indexOf(v);
  if (on && i === -1) wanting.push(v);
  if (!on && i !== -1) wanting.splice(i, 1);
  if (!on) v.pause();
  syncPlayback();
}

/**
 * Same-origin video only (CSP media-src 'self').
 * Decorative loops: muted, inline, looped, fetched only after the page has loaded and when near the viewport,
 * paused off-screen, never autoplayed for people who prefer reduced motion. The video stays transparent until
 * its first frame plays, so the still image underneath shows while it loads (or if autoplay is blocked, as in
 * iPhone Low Power Mode).
 */
export function LazyVideo({ src, poster, label, className = "", eager = false, controls = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el || controls) return;
    let alive = true;
    let near = false;
    const arm = () => whenPageReady().then(() => alive && setArmed(true));
    if (eager) arm();
    // Fetch a little before the clip arrives, but decode/play only while a real part of it is on screen:
    // keeps concurrent video decoding (the main scroll-jank source on budget phones) to one or two clips.
    const load = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !near) {
          near = true;
          arm();
        }
      },
      { rootMargin: "300px 0px" },
    );
    const play = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio >= 0.35), {
      threshold: [0, 0.35, 0.6],
    });
    load.observe(el);
    play.observe(el);
    return () => {
      alive = false;
      load.disconnect();
      play.disconnect();
    };
  }, [controls, eager]);

  useEffect(() => {
    const el = ref.current;
    if (!el || controls || !armed) return;
    // Autoplay is only allowed when muted; set the property explicitly (hydrated <video> may miss it).
    el.muted = true;
    el.defaultMuted = true;
    want(el, inView && !reduce);
    return () => want(el, false);
  }, [armed, inView, reduce, controls]);

  if (controls) {
    return (
      <video
        className={`h-full w-full object-cover ${className}`}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="none"
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
      />
    );
  }

  return (
    <video
      ref={ref}
      className={`relative h-full w-full object-cover transition-opacity duration-300 ${playing || reduce ? "opacity-100" : "opacity-0"} ${className}`}
      src={armed ? src : undefined}
      poster={reduce ? poster : undefined}
      muted
      loop
      playsInline
      preload={armed ? "metadata" : "none"}
      controls={reduce}
      onPlaying={() => setPlaying(true)}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    />
  );
}
