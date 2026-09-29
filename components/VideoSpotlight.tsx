"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import imageLoader from "@/lib/image-loader";

type Props = {
  src: string;
  poster?: string;
  /** Accessible name, e.g. "Priyadharsini on the saffron farm she is building". */
  label: string;
  name: string;
  role: string;
  facts: string[];
  ctaLabel: string;
  ctaHref: string;
  /** Classes for the thumbnail box (size/aspect). */
  className?: string;
};

/** Auto-opened spotlight: the close button unlocks after this long (the visitor sees at least 5 s). */
const LOCK_MS = 5000;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Her intro video as a "spotlight": the thumbnail on the page lifts off and grows into a centred player
 * (~70% of the screen) on a plum card with crocus art, then plays.
 * - Automatically on every page load (refresh included), when the thumbnail is well on screen: it plays
 *   (muted if the browser blocks sound, with a "Tap for sound" button) and can only be closed after 5 s
 *   (the close button counts down 5-4-3-2-1). It stays open until the visitor closes it.
 * - Tapping the thumbnail opens it with sound and can be closed any time.
 * - Close (✕, Esc, backdrop), sound toggle, and the ₹99 CTA. Never
 *   auto-opens for reduced-motion users. Transform/opacity animation only (smooth on budget phones).
 */
export function VideoSpotlight({ src, poster, label, name, role, facts, ctaLabel, ctaHref, className = "" }: Props) {
  const thumbRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const [open, setOpen] = useState<false | "auto" | "click">(false);
  const [phase, setPhase] = useState<"in" | "shown" | "out">("in");
  const [muted, setMuted] = useState(true);
  const [engaged, setEngaged] = useState(false);
  const [mounted, setMounted] = useState(false);
  /** Seconds left before an auto-opened spotlight can be closed (0 = closable). */
  const [lockLeft, setLockLeft] = useState(0);
  const locked = lockLeft > 0;

  useEffect(() => setMounted(true), []);

  /** Transform that makes the centred frame sit exactly on the thumbnail (FLIP). */
  const flipFromThumb = useCallback(() => {
    const t = thumbRef.current?.getBoundingClientRect();
    const f = frameRef.current;
    if (!t || !f) return "none";
    const r = f.getBoundingClientRect();
    return `translate(${t.left - r.left}px, ${t.top - r.top}px) scale(${t.width / r.width}, ${t.height / r.height})`;
  }, []);

  const lockedRef = useRef(false);
  lockedRef.current = locked;
  const close = useCallback(() => {
    if (lockedRef.current) return;
    window.clearTimeout(timer.current);
    const f = frameRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase("out");
    if (f && !reduce) {
      f.style.transition = `transform 480ms ${EASE}`;
      f.style.transform = flipFromThumb();
    }
    window.setTimeout(
      () => {
        videoRef.current?.pause();
        setOpen(false);
        setEngaged(false);
        setPhase("in");
        document.documentElement.classList.remove("vs-lock");
        thumbRef.current?.focus({ preventScroll: true });
      },
      reduce ? 150 : 480,
    );
  }, [flipFromThumb]);

  // Opening animation: start on the thumbnail, then glide to the centre.
  useLayoutEffect(() => {
    if (!open) return;
    const f = frameRef.current;
    if (!f) return;
    document.documentElement.classList.add("vs-lock");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      f.style.transition = "none";
      f.style.transform = flipFromThumb();
      f.getBoundingClientRect(); // commit the start frame
      f.style.transition = `transform 620ms ${EASE}`;
      f.style.transform = "none";
    }
    const id = requestAnimationFrame(() => setPhase("shown"));
    closeRef.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(id);
  }, [open, flipFromThumb]);

  // Playback: click-open = sound on; auto-open = try sound, fall back to muted (browser autoplay rules).
  useEffect(() => {
    const v = videoRef.current;
    if (!open || !v) return;
    const start = async () => {
      v.currentTime = 0;
      if (open === "click") {
        v.muted = false;
        setMuted(false);
        setEngaged(true);
        await v.play().catch(() => {});
        return;
      }
      try {
        v.muted = false;
        await v.play();
        setMuted(false);
      } catch {
        v.muted = true;
        setMuted(true);
        await v.play().catch(() => {});
      }
    };
    void start();
  }, [open]);

  // Auto-open: the close button unlocks after 5 s (counts down once per second).
  useEffect(() => {
    if (open !== "auto") return;
    const secs = Math.round(LOCK_MS / 1000);
    setLockLeft(secs);
    let left = secs;
    const id = window.setInterval(() => {
      left -= 1;
      setLockLeft(left);
      if (left <= 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Auto-open once per visit when the thumbnail sits well inside the screen for a moment.
  // Not for visitors arriving from an ad (utm_source or fbclid in the address): a video they can't close for
  // 5 s is the main reason cold Reels traffic left the page on 29 Sep 2026. They can still tap the thumbnail.
  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const q = new URLSearchParams(window.location.search);
    if (q.has("utm_source") || q.has("fbclid")) return;
    let dwell = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(dwell);
        if (!e.isIntersecting || e.intersectionRatio < 0.6) return;
        dwell = window.setTimeout(() => {
          if (document.visibilityState !== "visible") return;
          io.disconnect(); // once per page load
          setOpen("auto");
        }, 450);
      },
      { threshold: [0, 0.6, 0.9] },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(dwell);
      io.disconnect();
    };
  }, []);

  const engage = () => setEngaged(true);
  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    engage();
    v.muted = !v.muted;
    setMuted(v.muted);
    if (v.paused) void v.play().catch(() => {});
  };

  return (
    <>
      <button
        ref={thumbRef}
        type="button"
        onClick={() => setOpen("click")}
        aria-label={`Play video: ${label}`}
        className={`vs-thumb group relative block w-full overflow-hidden ${className}`}
      >
        {poster && (
          <img
            src={imageLoader({ src: poster, width: 640 })}
            srcSet={`${imageLoader({ src: poster, width: 384 })} 384w, ${imageLoader({ src: poster, width: 640 })} 640w`}
            sizes="210px"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
        <span aria-hidden="true" className="vs-thumb-play">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
          </svg>
        </span>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className={`vs-overlay is-${phase}`} role="dialog" aria-modal="true" aria-label={label}>
            <div className="vs-backdrop" onClick={close} />
            <div className="vs-card">
              <span aria-hidden="true" className="vs-card-art" />
              <div ref={frameRef} className="vs-frame">
                <video
                  ref={videoRef}
                  src={src}
                  poster={poster ? imageLoader({ src: poster, width: 828 }) : undefined}
                  playsInline
                  preload="auto"
                  onClick={toggleSound}
                  onEnded={engage}
                  className="h-full w-full object-cover"
                />
                <div className="vs-top">
                  <span className="vs-badge">Hear it from her</span>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={close}
                    disabled={locked}
                    className={`vs-btn ${locked ? "is-locked" : ""}`}
                    aria-label={locked ? `Close available in ${lockLeft} seconds` : "Close video"}
                  >
                    {locked ? (
                      <span className="vs-count" aria-hidden="true">
                        {lockLeft}
                      </span>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="vs-bottom">
                  <button type="button" onClick={toggleSound} className={`vs-sound ${muted ? "is-muted" : ""}`} aria-pressed={!muted}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
                      {muted ? (
                        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      ) : (
                        <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      )}
                    </svg>
                    <span>{muted ? "Tap for sound" : "Sound on"}</span>
                  </button>
                  {locked && <span aria-hidden="true" className="vs-progress" />}
                </div>
              </div>
              <aside className="vs-info">
                <p className="vs-kicker">Meet your host</p>
                <p className="vs-name">{name}</p>
                <p className="vs-role">{role}</p>
                <ul className="vs-facts">
                  {facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a href={ctaHref} onClick={close} className="vs-cta">
                  {ctaLabel}
                </a>
              </aside>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
