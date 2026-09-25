"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster?: string;
  label: string;
  className?: string;
  /** Load immediately (above the fold). Otherwise the file is only fetched near the viewport. */
  eager?: boolean;
  /** Real player with sound + controls (intro video). Decorative loops are muted + autoplay. */
  controls?: boolean;
};

/**
 * Same-origin video only (CSP media-src 'self').
 * Decorative loops: muted, inline, looped, fetched lazily, paused off-screen,
 * and never autoplayed for people who prefer reduced motion.
 */
export function LazyVideo({ src, poster, label, className = "", eager = false, controls = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(eager || controls);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el || controls) return;
    // Fetch a little before the clip arrives, but decode/play only while a real part of it is on screen:
    // keeps concurrent video decoding (the main scroll-jank source on budget phones) to one or two clips.
    const load = new IntersectionObserver(([e]) => e.isIntersecting && setArmed(true), { rootMargin: "300px 0px" });
    const play = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio >= 0.35), {
      threshold: [0, 0.35, 0.6],
    });
    load.observe(el);
    play.observe(el);
    return () => {
      load.disconnect();
      play.disconnect();
    };
  }, [controls]);

  useEffect(() => {
    const el = ref.current;
    if (!el || controls || !armed) return;
    // Autoplay is only allowed when muted; set the property explicitly (hydrated <video> may miss it).
    el.muted = true;
    el.defaultMuted = true;
    if (inView && !reduce) el.play().catch(() => {});
    else el.pause();
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
      className={`h-full w-full object-cover ${className}`}
      src={armed ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      preload={armed ? "metadata" : "none"}
      controls={reduce}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    />
  );
}
