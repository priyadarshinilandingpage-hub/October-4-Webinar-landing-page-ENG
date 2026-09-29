"use client";

import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/*
 * "Saffron Ledger" motion kit. Signature, fast (≤0.6s) reveals instead of generic fade-ups:
 *  - Reveal / Stagger: ink-wipe (clip-path) reveals, like a ledger row being written in.
 *  - RiseText: words rise line-by-line out of their own masks (headings).
 *  - PetalReveal: media opens like a crocus bud (clip-path ellipse), or wipes across.
 *  - Odometer: numbers roll into place like a mechanical counter.
 *  - SaffronThread: one red-orange thread that draws down the page margin as you scroll.
 *  - TimelineRail: a vertical thread that fills as a timeline scrolls past.
 *
 * Reduced motion: MotionConfig skips transforms, globals.css forces every [data-reveal] element to be
 * fully visible (no clip, no movement), and the CSS-driven pieces (RiseText, Odometer, PetalReveal "load",
 * CrocusBloom) render in their final state. Without JS, [data-reveal] is forced visible by the <noscript>
 * style in app/layout.tsx and the CSS-driven pieces are visible by default.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
// Starts a little BEFORE the element scrolls in (bottom margin +12%), so fast scrolling never meets a blank area.
const VIEWPORT = { once: true, margin: "0px 0px 12% 0px" } as const;

function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Wrap the page once (app/page.tsx → LandingPage). Keeps the motion bundle small (LazyMotion + `m`). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

/**
 * Generic block reveal (cards, groups, section heads). The block is "inked in" from its baseline
 * upward (clip-path wipe) while rising a few px. `y` = rise distance in px. Clip is removed at the end
 * so shadows/overhanging decorations are never cut off.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <m.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: Math.round(y * 0.6), clipPath: "inset(100% 0% 0% 0%)" }}
      whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", transitionEnd: { clipPath: "none" } }}
      viewport={VIEWPORT}
      transition={{
        delay,
        clipPath: { duration: 0.55, ease: EASE, delay },
        opacity: { duration: 0.28, ease: "linear", delay },
        y: { duration: 0.55, ease: EASE, delay },
      }}
    >
      {children}
    </m.div>
  );
}

const group: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };
const item: Variants = {
  hidden: { opacity: 0, x: -8, clipPath: "inset(0% 100% 0% 0%)" },
  show: {
    opacity: 1,
    x: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: { duration: 0.5, ease: EASE, opacity: { duration: 0.25, ease: "linear" } },
    transitionEnd: { clipPath: "none" },
  },
};

/** Parent for a list/grid whose children (StaggerItem) are written in one after another, left → right. */
export function Stagger({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const Comp = as === "ul" ? m.ul : as === "ol" ? m.ol : m.div;
  return (
    <Comp className={className} variants={group} initial="hidden" whileInView="show" viewport={VIEWPORT}>
      {children}
    </Comp>
  );
}

/** Child of <Stagger>: wipes in from the left like a ledger row being written. */
export function StaggerItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Comp = as === "li" ? m.li : m.div;
  return (
    <Comp data-reveal="" className={className} variants={item}>
      {children}
    </Comp>
  );
}

/**
 * Vertical timeline rail: a dashed pencil guide with a solid saffron thread that fills as you scroll.
 * Rail sits at left 19px (md: 27px) so timeline dots can be centred on it. Static full rail under reduced motion.
 */
export function TimelineRail({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return (
    <div ref={ref} className={`relative ${className}`}>
      <div aria-hidden="true" className="rail-guide absolute top-2 bottom-2 left-[19px] w-px md:left-[27px]" />
      <m.div
        aria-hidden="true"
        data-reveal=""
        style={{ scaleY, transformOrigin: "top" }}
        className="absolute top-2 bottom-2 left-[18.25px] w-[2px] bg-thread md:left-[26.25px]"
      />
      {children}
    </div>
  );
}

/* ─────────────────────────── RiseText: line-by-line mask rise ─────────────────────────── */

export type RiseSegment = { t: string; em?: boolean };

/**
 * Heading text whose words rise out of their own masks.
 * - trigger="view" (default): words of the same line rise together, line after line, when scrolled into view.
 *   If the text is already on screen when JS loads, it simply stays visible (no flash).
 * - trigger="load": pure CSS, plays at first paint (use above the fold, e.g. the hero h1).
 * Render inside your own <h1>/<h2>/<p>: `<h2 className="..."><RiseText text="..." /></h2>`.
 * Pass `segments` for mixed roman/italic text: [{ t: "Idhu " }, { t: "en farm.", em: true }].
 */
export function RiseText({
  text,
  segments,
  className = "",
  emClassName = "",
  trigger = "view",
  delay = 0,
}: {
  text?: string;
  segments?: RiseSegment[];
  className?: string;
  emClassName?: string;
  trigger?: "view" | "load";
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"idle" | "armed" | "in">("idle");

  useIsoLayoutEffect(() => {
    if (trigger !== "view" || prefersReduced()) return;
    const el = ref.current;
    if (!el) return;
    // Group words into visual lines so each line rises as one.
    let line = -1;
    let lastTop = Number.NEGATIVE_INFINITY;
    for (const w of Array.from(el.querySelectorAll<HTMLElement>(".rise-w"))) {
      const top = w.offsetTop;
      if (top > lastTop + 4) {
        line += 1;
        lastTop = top;
      }
      w.style.setProperty("--l", String(line));
    }
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.94 && r.bottom > 0) return; // already visible: never hide it
    setState("armed");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  const segs = segments ?? [{ t: text ?? "" }];
  let i = 0;
  return (
    <span
      ref={ref}
      className={`rise ${trigger === "load" ? "rise-load" : ""} ${className}`}
      data-state={state}
      style={{ "--d": `${delay}s` } as CSSProperties}
    >
      {segs.map((s, si) => {
        const nodes = s.t.split(/(\s+)/).map((w, wi) => {
          if (!w) return null;
          if (/^\s+$/.test(w)) return " ";
          const idx = i++;
          return (
            <span key={wi} className="rise-w">
              <span className="rise-i" style={{ "--i": idx } as CSSProperties}>
                {w}
              </span>
            </span>
          );
        });
        return s.em ? (
          <em key={si} className={emClassName}>
            {nodes}
          </em>
        ) : (
          <Fragment key={si}>{nodes}</Fragment>
        );
      })}
    </span>
  );
}

/* ─────────────────────────── Odometer: mechanical number roll ─────────────────────────── */

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Stat value whose digits roll into place like a ledger counter ("39.4K", "Day 58+", "5+ yrs").
 * Non-digits are printed as-is. Plays at first paint when on screen, otherwise when scrolled into view.
 * Screen readers get the plain value. Inherits font/size/colour from its parent.
 */
export function Odometer({ value, className = "", delay = 0 }: { value: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [wait, setWait] = useState(false);

  useIsoLayoutEffect(() => {
    if (prefersReduced()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // on screen: the CSS roll already plays
    setWait(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setWait(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let c = 0;
  return (
    <span ref={ref} className={`odo ${className}`} data-wait={wait ? "" : undefined} style={{ "--d": `${delay}s` } as CSSProperties}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="odo-vis">
        {Array.from(value).map((ch, k) =>
          /\d/.test(ch) ? (
            <span key={k} className="odo-col">
              <span className="odo-ghost">{ch}</span>
              <span className="odo-strip" style={{ "--n": ch, "--c": c++ } as CSSProperties}>
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          ) : (
            <span key={k}>{ch === " " ? " " : ch}</span>
          ),
        )}
      </span>
    </span>
  );
}

/* ─────────────────────────── PetalReveal: media opens like a bud ─────────────────────────── */

const SHAPES = {
  petal: { from: "ellipse(9% 26% at 50% 100%)", to: "ellipse(82% 82% at 50% 50%)" },
  wipe: { from: "inset(0% 100% 0% 0%)", to: "inset(0% 0% 0% 0%)" },
} as const;

/**
 * Clip-path reveal for photos/videos/plates.
 * shape="petal": a narrow bud at the bottom-centre opens into the full frame. shape="wipe": left → right.
 * trigger="load": pure CSS at first paint (hero, LCP-safe: starts partly open). Otherwise on scroll.
 * Put sizing/rounding classes on the child media box; `className` goes on the clipping wrapper.
 */
export function PetalReveal({
  children,
  className = "",
  delay = 0,
  shape = "petal",
  trigger = "view",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  shape?: "petal" | "wipe";
  trigger?: "view" | "load";
}) {
  if (trigger === "load") {
    return (
      <div className={`${shape === "wipe" ? "wipe-load" : "petal-load"} ${className}`} style={{ "--d": `${delay}s` } as CSSProperties}>
        {children}
      </div>
    );
  }
  const s = SHAPES[shape];
  return (
    <m.div
      data-reveal=""
      className={className}
      initial={{ clipPath: s.from }}
      whileInView={{ clipPath: s.to, transitionEnd: { clipPath: "none" } }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </m.div>
  );
}

/* ─────────────────────────── SaffronThread: the scroll-drawn thread ─────────────────────────── */

type ThreadGeo = { w: number; h: number; d: string; knots: { x: number; y: number }[] };

/**
 * One thin red-orange thread that draws itself down the left page margin as you scroll, weaving
 * gently and passing a small stitch at the top of every section. Place it as the FIRST child of the
 * page's <main> (which must be position: relative). It sits behind section content (z-index -1),
 * so cards and the plum band pass over it. Hidden below md (the phone gutter is too tight);
 * drawn fully and statically under reduced motion.
 */
export function SaffronThread() {
  const svgRef = useRef<SVGSVGElement>(null);
  const metrics = useRef({ top: 0, h: 1 });
  const [geo, setGeo] = useState<ThreadGeo | null>(null);
  // Drawn once, fully (30 Sep 2026): the scroll-linked redraw of a page-long path cost frames on laptops.

  useEffect(() => {
    const svg = svgRef.current;
    const host = svg?.parentElement;
    if (!svg || !host) return;
    let raf = 0;
    const build = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (window.innerWidth < 1024) return; // desktop only: the scroll-drawn path costs frames on tablets and phones
        const hostRect = host.getBoundingClientRect();
        const h = Math.max(1, Math.round(host.offsetHeight));
        // Width of the free gutter left of the content column.
        let gutter = 40;
        const wrap = host.querySelector<HTMLElement>(".wrap");
        if (wrap) {
          const r = wrap.getBoundingClientRect();
          gutter = r.left - hostRect.left + (parseFloat(getComputedStyle(wrap).paddingLeft) || 0);
        }
        const w = Math.round(Math.max(18, Math.min(110, gutter - 6)));
        const x0 = w / 2;
        const amp = Math.max(3, Math.min(28, w / 2 - 6));
        // Left-right-left in soft, rounded corners: a triangle wave with its peaks rounded off
        // (asin of a slightly damped sine), a slow drift in the swing so no two bends look identical,
        // and a faint hand-drawn tremble on top. Subtle by design: it lives in the margin.
        const period = 360;
        const xAt = (y: number) => {
          const phase = (y / period) * Math.PI * 2 + Math.sin(y / 1900) * 0.6;
          const bend = (2 / Math.PI) * Math.asin(0.965 * Math.sin(phase));
          const swing = amp * (0.82 + 0.18 * Math.sin(y / 1300));
          const tremble = 0.7 * Math.sin(y / 23) + 0.45 * Math.sin(y / 11 + 1.7);
          return x0 + swing * bend + tremble;
        };
        const pts: string[] = [];
        for (let y = 0; y <= h; y += 8) pts.push(`${xAt(y).toFixed(1)},${y}`);
        pts.push(`${xAt(h).toFixed(1)},${h}`);
        const knots = Array.from(host.querySelectorAll<HTMLElement>("section"))
          .filter((s) => s.parentElement === host || s.parentElement?.parentElement === host)
          .map((s) => Math.round(s.getBoundingClientRect().top - hostRect.top))
          .filter((y) => y > 80 && y < h - 80)
          .map((y) => ({ x: xAt(y), y }));
        metrics.current = { top: hostRect.top + window.scrollY, h };
        setGeo({ w, h, d: `M${pts.join("L")}`, knots });
      });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(host);
    window.addEventListener("resize", build);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", build);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      className="thread pointer-events-none absolute top-0 left-0 z-[-1] hidden md:block"
      width={geo?.w ?? 1}
      height={geo?.h ?? 1}
      viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : "0 0 1 1"}
    >
      {geo && (
        <>
          <path d={geo.d} className="thread-guide" fill="none" />
          {geo.knots.map((k) => (
            <path key={k.y} className="thread-knot" d={`M${k.x - 3.5} ${k.y - 3.5}l7 7M${k.x + 3.5} ${k.y - 3.5}l-7 7`} fill="none" />
          ))}
          <path d={geo.d} className="thread-line" fill="none" />
        </>
      )}
    </svg>
  );
}
