"use client";

import type { CSSProperties } from "react";
import { Fx } from "./sections/Fx";

/*
 * Botanical art for the "bold type" variant (/bold → LandingPage type="bold"). Rendered ONLY there;
 * all styling + motion lives in app/bold.css under [data-type="bold"].
 *
 * Saffron crocus (Crocus sativus): six violet tepals with darker veins, a pale throat, three long
 * red-orange stigmas (the saffron threads) and three yellow anthers; grass-like leaves with a pale
 * midrib. Supporting blooms: jasmine (malli poo) flowers + buds, in cream.
 *
 * Lean DOM: every repeated shape lives ONCE in <FlowerDefs/> (rendered once per page by LandingPage)
 * and is drawn with <use>. Only the wrappers that move are real elements.
 * A client module on purpose, imported ONLY by app/bold/page.tsx (the pieces reach the page through
 * LandingPage's `floral` prop): the RSC payload carries a reference instead of a second copy of the SVG,
 * and `/` + `/dark` never download this code.
 *
 * Motion (all transform/opacity, CSS only):
 *  .fl-load   → plays once at first paint (hero).
 *  .fl-reveal → plays once when scrolled into view (the <Fx> wrapper sets data-fx="armed" → "in").
 * Reduced motion / no JS: everything renders static and fully open.
 */

type Vars = Record<`--${string}`, string | number>;
const v = (o: Vars) => o as CSSProperties;
const r1 = (n: number) => Math.round(n * 10) / 10;

const C = {
  v900: "#452a86", // veins, throat shadow
  v700: "#6a4bb5",
  v600: "#7b5cc4", // outer tepals
  v500: "#9379d4", // inner tepals
  v400: "#ad98e2",
  v300: "#c6b6ee",
  stig: "#6d28d9",
  stigDeep: "#5b21b6",
  anther: "#ddd6fe",
  antherDeep: "#a78bfa",
  throat: "#f5f3ff",
  leaf: "#6d5bb0",
  leafDeep: "#4c3d86",
  leafLight: "#9d8fd6",
  rib: "#f5f3ff",
  stem: "#ddd6fe",
  stemDeep: "#c4b5fd",
  sheath: "#ede9fe",
  jas: "#f5f3ff",
  jasEdge: "#c4b5fd",
} as const;

/* ───────────────────────── Shared shapes (one sprite per page) ───────────────────────── */

// Sprite ids (page-unique: <FlowerDefs/> renders once).
const ID = {
  tepal: "flx-tepal", // body only (fill inherited from the <use>)
  tepalD: "flx-tepal-d", // body + shading + veins
  thread: "flx-thread", // one saffron stigma
  eye: "flx-eye", // throat + three anthers
  jasmine: "flx-jasmine",
  bud: "flx-bud",
  leaflet: "flx-leaflet",
  sheath: "flx-sheath",
  cupBack: "flx-cup-back",
  cupFront: "flx-cup-front",
  cupThreads: "flx-cup-threads",
} as const;
const href = (id: string) => `#${id}`;

// One tepal pointing up, base at (0,0). Overlays stay inside the outline, so the bounding box
// (transform-box: fill-box) has its bottom-centre exactly on the flower centre.
const PETAL = "M0 0C-7.5-5-13.5-17-12.6-28.6C-11.8-37.4-6-41.4 0-41.8S11.8-37.4 12.6-28.6C13.5-17 7.5-5 0 0Z";
const PETAL_LIGHT = "M0-1.6C-5.6-6.6-10.1-16.8-9.6-27.4C-9.1-34.8-5.2-39.2-.5-39.6C-1.7-29.8-1.9-14.6 0-1.6Z";
const PETAL_SHADE = "M0 0C-4-3.4-6.6-8.4-6.9-13.6C-3.6-12.1-1-11.6 0-11.6S3.6-12.1 6.9-13.6C6.6-8.4 4-3.4 0 0Z";
const PETAL_VEINS = "M0-2.5C.3-14 .2-26-.2-37M-.8-4C-3.8-12-5.6-21.5-5.9-31M.8-4C3.8-12 5.6-21.5 5.9-31";
// A saffron thread: starts at the centre and droops over a tepal, flaring into a trumpet tip.
const STIGMA = "M0-2C1.4-10.4.4-20.2 3.2-29C4.1-32.2 5.4-34.8 6.9-36.8";
const STIGMA_TIP = "M5.2-36.2C5.7-40.4 9.6-41.9 10.8-38.9C9.9-36.8 7.5-35.5 5.2-36.2Z";
const ANTHER = "M0-4.5C-2-8.3-2.4-13.6-1.2-18C-.6-19.8.6-19.8 1.2-18C2.4-13.6 2-8.3 0-4.5Z";
const JAS_PETAL = "M0-1.8C-3.3-3.6-4.3-8.6-2.5-11.8C-1.5-13.4 1.5-13.4 2.5-11.8C4.3-8.6 3.3-3.6 0-1.8Z";
const LEAFLET = "M0 0C-4.6-4.2-5.8-11.6-2.6-17.2C-1.2-19.6 1.2-19.6 2.6-17.2C5.8-11.6 4.6-4.2 0 0Z";

/** The page's flower sprite. Render once (LandingPage does, for type="bold"); every piece below <use>s it. */
export function FlowerDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
      <defs>
        <path id={ID.tepal} d={PETAL} />
        <g id={ID.tepalD}>
          <use href={href(ID.tepal)} />
          <path d={PETAL_SHADE} fill={C.v900} fillOpacity={0.3} />
          <path d={PETAL_LIGHT} fill="#fff" fillOpacity={0.2} />
          <path d={PETAL_VEINS} fill="none" stroke={C.v900} strokeOpacity={0.38} strokeWidth={0.75} strokeLinecap="round" />
        </g>
        <g id={ID.thread}>
          <path d={STIGMA} fill="none" stroke={C.stig} strokeWidth={2.2} strokeLinecap="round" />
          <path d={STIGMA_TIP} fill={C.stigDeep} />
        </g>
        <g id={ID.eye}>
          <circle r={4.8} fill={C.throat} />
          {[62, 178, 302].map((a) => (
            <path key={a} transform={`rotate(${a})`} d={ANTHER} fill={C.anther} />
          ))}
        </g>
        <g id={ID.jasmine}>
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} transform={`rotate(${a})`} d={JAS_PETAL} fill={C.jas} stroke={C.jasEdge} strokeWidth={0.8} />
          ))}
          <circle r={2.3} fill={C.anther} />
          <circle r={0.9} fill={C.antherDeep} />
        </g>
        <g id={ID.bud}>
          <path d="M0 6V0" stroke={C.leaf} strokeWidth={1.2} strokeLinecap="round" />
          <path d="M0-3C-2.8-6.4-3.6-12.6-2.3-17.2C-1.6-19.6 1.6-19.6 2.3-17.2C3.6-12.6 2.8-6.4 0-3Z" fill={C.jas} stroke={C.jasEdge} strokeWidth={0.8} />
          <path d="M0 0C-2.2-.6-3-2.4-2.6-4.4L0-3.2 2.6-4.4C3-2.4 2.2-.6 0 0Z" fill={C.leaf} />
        </g>
        <g id={ID.leaflet}>
          <path d={LEAFLET} />
          <path d="M0-1.5V-15.5" fill="none" stroke={C.rib} strokeOpacity={0.6} strokeWidth={0.7} strokeLinecap="round" />
        </g>
        <path id={ID.sheath} d="M-2.7 0C-3.3-12-1.7-22 0-29 1.7-22 3.3-12 2.7 0Z" fill={C.sheath} />
        {/* Profile crocus, drawn with its base at (0,0): back tepals + anthers, then (front tepals are live
            elements in <CupCrocus/>) the front-centre tepal, then the threads. */}
        <g id={ID.cupBack}>
          <path d="M0-2C-9-7-17-20-16.5-34C-16-43-11-48-6-46C-3-36-1.5-16 0-2Z" fill={C.v300} />
          <path d="M0-2C9-7 17-20 16.5-34C16-43 11-48 6-46C3-36 1.5-16 0-2Z" fill={C.v400} />
          <path d="M-2.6-22C-4-30-4-38-2.8-44M2.6-22C4-30 4-38 2.8-44" fill="none" stroke={C.anther} strokeWidth={2.6} strokeLinecap="round" />
        </g>
        <g id={ID.cupFront}>
          <path d="M0 1C-8-5-11.5-20-9.5-33C-8-42-3.5-46.5 0-46.5S8-42 9.5-33C11.5-20 8-5 0 1Z" fill={C.v500} />
          <path d="M0-1C-5.5-7-8.2-19-7-31C-6-39-3-44-.3-44.4C-1.6-32-1.6-15 0-1Z" fill="#fff" fillOpacity={0.2} />
          <path
            d="M0-2V-43M-.6-4C-3.4-13-4.8-24-4.9-35M.6-4C3.4-13 4.8-24 4.9-35"
            fill="none"
            stroke={C.v900}
            strokeOpacity={0.36}
            strokeWidth={0.7}
            strokeLinecap="round"
          />
        </g>
        <g id={ID.cupThreads}>
          <path d="M0-36C-1.8-43-5.5-50-10-56M0-36C.2-45 1-52 1.8-59M0-36C2.4-43 6.6-49 11.6-54" fill="none" stroke={C.stig} strokeWidth={2.1} strokeLinecap="round" />
          <path d="M-8.5-56.5a1.8 1.8 0 1 0-3.6 0a1.8 1.8 0 1 0 3.6 0M3.7-59.4a1.8 1.8 0 1 0-3.6 0a1.8 1.8 0 1 0 3.6 0M13.7-54.4a1.8 1.8 0 1 0-3.6 0a1.8 1.8 0 1 0 3.6 0" fill={C.stigDeep} />
        </g>
      </defs>
    </svg>
  );
}

/* ───────────────────────── Parts ───────────────────────── */

/**
 * Open saffron crocus seen from above. (x, y) = centre; s = scale (1 ≈ 84 units across);
 * tilt < 1 squashes it as if seen at an angle; k = stagger slot for the bloom animation.
 */
function OpenCrocus({
  x,
  y,
  s = 1,
  tilt = 1,
  rot = 0,
  k = 0,
  detail = true,
  soft = false,
}: {
  x: number;
  y: number;
  s?: number;
  tilt?: number;
  rot?: number;
  k?: number;
  detail?: boolean;
  soft?: boolean;
}) {
  const outer = soft ? C.v500 : C.v600;
  const inner = soft ? C.v400 : C.v500;
  const tepal = href(detail ? ID.tepalD : ID.tepal);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s} ${r1(s * tilt * 100) / 100})`}>
      <g className="fl-head" style={v({ "--k": k })}>
        {[0, 118, 243].map((a, i) => (
          <g key={a} transform={`rotate(${a})`}>
            <use className="fl-p" href={tepal} fill={outer} style={v({ "--i": i * 2 })} />
          </g>
        ))}
        {[62, 178, 302].map((a, i) => (
          <g key={a} transform={`rotate(${a}) scale(.84 .87)`}>
            <use className="fl-p" href={tepal} fill={inner} style={v({ "--i": i * 2 + 1 })} />
          </g>
        ))}
        <use className="fl-an" href={href(ID.eye)} />
        {[10, 128, 252].map((a, i) => (
          <g key={a} transform={`rotate(${a})`}>
            <use className="fl-st" href={href(ID.thread)} style={v({ "--i": i })} />
          </g>
        ))}
      </g>
    </g>
  );
}

/** Crocus in profile: a goblet on a pale stem with a papery sheath. (x, y) = stem base. */
function CupCrocus({ x, y, s = 1, rot = 0, k = 0, stem = 48 }: { x: number; y: number; s?: number; rot?: number; k?: number; stem?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <g className="fl-cup" style={v({ "--k": k })}>
        <path d={`M0 0C.8-${r1(stem * 0.35)} .3-${r1(stem * 0.7)} 0-${stem}`} fill="none" stroke={C.stem} strokeWidth={3.2} strokeLinecap="round" />
        <use href={href(ID.sheath)} />
        <g transform={`translate(0 -${stem})`}>
          <use href={href(ID.cupBack)} />
          <path className="fl-cl" d="M0 0C-11-4-19.5-17-19-31C-18.6-40-13-44.5-8.5-42C-4.5-33-2-14 0 0Z" fill={C.v600} />
          <path className="fl-cr" d="M0 0C11-4 19.5-17 19-31C18.6-40 13-44.5 8.5-42C4.5-33 2-14 0 0Z" fill={C.v700} />
          <use href={href(ID.cupFront)} />
          <use className="fl-an" href={href(ID.cupThreads)} />
        </g>
      </g>
    </g>
  );
}

/** Grass-like crocus leaf with a pale midrib, growing up from (x, y); bend = tip's sideways offset. */
function Blade({ x, y, len, bend, rot = 0, w = 3.2, fill = C.leaf, k = 0 }: { x: number; y: number; len: number; bend: number; rot?: number; w?: number; fill?: string; k?: number }) {
  const c1 = -len * 0.38;
  const c2 = -len * 0.74;
  const d = `M${r1(-w)} 0C${r1(-w + bend * 0.08)} ${r1(c1)} ${r1(bend * 0.5 - w * 0.55)} ${r1(c2)} ${r1(bend)} ${r1(-len)}C${r1(bend * 0.5 + w * 0.55)} ${r1(c2)} ${r1(w + bend * 0.08)} ${r1(c1)} ${r1(w)} 0Z`;
  const rib = `M0-3C${r1(bend * 0.08)} ${r1(c1)} ${r1(bend * 0.5)} ${r1(c2)} ${r1(bend * 0.93)} ${r1(-len * 0.93)}`;
  // transform-origin (fill-box) at the base: where x = 0 sits inside the leaf's horizontal extent.
  const minX = Math.min(-w, bend);
  const maxX = Math.max(w, bend);
  const ox = `${r1(((0 - minX) / (maxX - minX)) * 100)}%`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <g className="fl-leaf" style={v({ "--k": k, "--ox": ox })}>
        <path d={d} fill={fill} />
        <path d={rib} fill="none" stroke={C.rib} strokeOpacity={0.75} strokeWidth={0.9} strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Pale flower stalk (absolute coordinates, drawn behind the heads). Fades in with the anthers. */
function Stalk({ d, k = 0 }: { d: string; k?: number }) {
  return <path className="fl-an" style={v({ "--k": k })} d={d} fill="none" stroke={C.stemDeep} strokeWidth={3} strokeLinecap="round" />;
}

/** Jasmine (malli poo) flower or bud: one <use>, popping in. */
function Jasmine({ x, y, s = 1, rot = 0, k = 0, bud = false }: { x: number; y: number; s?: number; rot?: number; k?: number; bud?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <use className="fl-pop" href={href(bud ? ID.bud : ID.jasmine)} style={v({ "--k": k })} />
    </g>
  );
}

/** Small ovate leaf on the garland vine. */
function Leaflet({ x, y, rot, s = 1, fill = C.leaf, k = 0 }: { x: number; y: number; rot: number; s?: number; fill?: string; k?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})${s === 1 ? "" : ` scale(${s})`}`}>
      <use className="fl-leaf" href={href(ID.leaflet)} fill={fill} style={v({ "--k": k })} />
    </g>
  );
}

/* ───────────────────────── Compositions ───────────────────────── */

/** Hero bouquet (desktop): heads fan out at the top and down the right side, behind the headline strips. */
export function CrownArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 380" className={`overflow-visible ${className}`} aria-hidden="true" focusable="false">
      <Blade x={128} y={380} len={300} bend={-46} rot={-4} w={4} fill={C.leafDeep} k={0} />
      <Blade x={136} y={380} len={210} bend={-80} rot={-18} w={3.6} fill={C.leaf} k={1} />
      <Blade x={140} y={380} len={340} bend={36} rot={6} w={4.2} fill={C.leaf} k={1} />
      <Blade x={150} y={380} len={250} bend={90} rot={14} w={3.8} fill={C.leafLight} k={2} />
      <Blade x={158} y={380} len={260} bend={40} rot={20} w={4} fill={C.leafDeep} k={2} />
      <Blade x={146} y={380} len={170} bend={90} rot={28} w={3.4} fill={C.leafLight} k={3} />
      <Blade x={162} y={380} len={200} bend={-30} rot={36} w={3.4} fill={C.leaf} k={3} />
      <Stalk d="M72 104C86 190 118 300 136 380" k={1} />
      <Stalk d="M170 116C165 204 150 300 142 380" k={0} />
      <Stalk d="M256 204C234 262 188 332 150 380" k={2} />
      <CupCrocus x={214} y={378} s={1.15} rot={4} stem={80} k={3} />
      <Jasmine x={122} y={30} s={1.1} rot={10} k={2} />
      <Jasmine bud x={152} y={16} s={0.9} rot={24} k={3} />
      <OpenCrocus x={70} y={96} s={0.82} tilt={0.9} rot={34} k={1} />
      <OpenCrocus x={170} y={108} s={1.6} tilt={0.86} rot={10} k={0} />
      <OpenCrocus x={262} y={196} s={1.05} tilt={0.8} rot={-22} k={2} soft />
      <Jasmine x={288} y={116} s={0.95} rot={-14} k={3} />
      <Jasmine x={230} y={292} s={1} rot={20} k={4} />
      <Jasmine bud x={292} y={270} s={0.9} rot={30} k={4} />
      <Jasmine x={272} y={338} s={0.8} rot={-8} k={5} />
    </svg>
  );
}

/** Phones/tablets: a compact bloom that sits on the photo plate, just above the credential tags. */
export function PlateBloomArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 150" className={`overflow-visible ${className}`} aria-hidden="true" focusable="false">
      <Blade x={70} y={150} len={128} bend={-34} rot={-10} w={2.8} fill={C.leafDeep} k={0} />
      <Blade x={74} y={150} len={84} bend={-60} rot={-24} w={2.6} fill={C.leafLight} k={1} />
      <Blade x={76} y={150} len={118} bend={30} rot={14} w={2.8} fill={C.leaf} k={1} />
      <CupCrocus x={100} y={150} s={0.9} rot={12} stem={44} k={2} />
      <OpenCrocus x={56} y={60} s={1.02} tilt={0.84} rot={-14} k={0} />
      <Jasmine x={104} y={26} s={0.95} rot={12} k={3} />
      <Jasmine bud x={20} y={112} s={0.9} rot={-30} k={3} />
    </svg>
  );
}

/** Desktop: a cluster bursting out from behind the photo plate's lower-left corner (mostly hidden by it). */
export function PlateBurstArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 260" className={`overflow-visible ${className}`} aria-hidden="true" focusable="false">
      <Blade x={180} y={150} len={170} bend={-30} rot={-62} w={3.2} fill={C.leafDeep} k={0} />
      <Blade x={184} y={154} len={190} bend={24} rot={-100} w={3.4} fill={C.leaf} k={1} />
      <Blade x={182} y={156} len={150} bend={30} rot={-135} w={3.2} fill={C.leafLight} k={2} />
      <Blade x={186} y={158} len={90} bend={-20} rot={170} w={2.8} fill={C.leafDeep} k={2} />
      <Stalk d="M66 132C110 138 150 146 182 152" k={0} />
      <Stalk d="M122 222C140 198 160 172 184 156" k={1} />
      <Jasmine x={26} y={70} s={1} rot={8} k={2} />
      <Jasmine bud x={40} y={176} s={0.9} rot={-120} k={3} />
      <OpenCrocus x={62} y={128} s={1.15} tilt={0.84} rot={-28} k={0} />
      <OpenCrocus x={118} y={226} s={0.78} tilt={0.8} rot={18} k={1} soft detail={false} />
      <Jasmine x={70} y={205} s={0.85} rot={-12} k={3} />
      <Jasmine x={198} y={238} s={0.8} rot={20} k={4} />
    </svg>
  );
}

/** Left half of the garland (x 34 → 320); mirrored for the right half. */
function GarlandHalf() {
  return (
    <>
      <path
        className="fl-vine"
        d="M320 50C296 42 276 60 250 57C222 54 204 40 176 43C146 46 128 62 100 58C80 55 64 46 44 47C40 47.2 37 48.2 34 50"
        fill="none"
        stroke={C.leaf}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Leaflet x={298} y={47} rot={-40} k={0} />
      <Leaflet x={272} y={58} rot={-148} fill={C.leafLight} k={0} />
      <Leaflet x={232} y={52} rot={-30} fill={C.leafDeep} k={1} />
      <Leaflet x={188} y={42} rot={-158} k={1} />
      <Leaflet x={152} y={46} rot={-38} fill={C.leafLight} k={2} />
      <Leaflet x={118} y={57} rot={-146} fill={C.leafDeep} k={2} />
      <Leaflet x={80} y={53} rot={-32} s={0.85} k={3} />
      <Leaflet x={56} y={47} rot={-150} s={0.8} fill={C.leafLight} k={3} />
      <Jasmine bud x={286} y={68} s={0.7} rot={172} k={2} />
      <Jasmine x={256} y={36} s={0.8} rot={12} k={1} />
      <OpenCrocus x={206} y={44} s={0.5} tilt={0.86} rot={-20} k={2} detail={false} />
      <Jasmine bud x={174} y={62} s={0.75} rot={160} k={3} />
      <CupCrocus x={134} y={52} s={0.44} rot={-10} stem={28} k={3} />
      <Jasmine x={98} y={42} s={0.66} rot={-8} k={4} />
      <Jasmine x={62} y={62} s={0.55} rot={30} k={4} />
    </>
  );
}

/** Symmetric flower garland (divider). variant "trio" puts three profile crocuses in the middle. */
export function GarlandArt({ variant = "crocus", className = "" }: { variant?: "crocus" | "trio"; className?: string }) {
  return (
    <svg viewBox="0 0 640 96" className={`overflow-visible ${className}`} aria-hidden="true" focusable="false">
      <GarlandHalf />
      <g transform="matrix(-1 0 0 1 640 0)">
        <GarlandHalf />
      </g>
      {variant === "crocus" ? (
        <OpenCrocus x={320} y={48} s={0.98} tilt={0.9} rot={-6} k={0} />
      ) : (
        <>
          <CupCrocus x={312} y={96} s={0.6} rot={-38} stem={34} k={1} />
          <CupCrocus x={328} y={96} s={0.6} rot={38} stem={34} k={2} />
          <CupCrocus x={320} y={98} s={0.72} rot={0} stem={40} k={0} />
          <Jasmine x={292} y={84} s={0.66} k={3} />
          <Jasmine x={348} y={84} s={0.66} rot={30} k={3} />
        </>
      )}
    </svg>
  );
}

/* ───────────────────────── Placed pieces ───────────────────────── */

const FLOATS = [
  { cls: "left-[4%] top-[2%] w-4", fill: C.v500, vars: { "--dur": "17s", "--dl": "-4s", "--dx": "14px", "--dy": "22px", "--dr": "40deg" } },
  { cls: "left-[88%] top-[46%] w-3.5", fill: C.v400, vars: { "--dur": "21s", "--dl": "-9s", "--dx": "-12px", "--dy": "26px", "--dr": "-50deg" } },
  { cls: "left-[46%] -top-[4%] w-3", fill: C.v600, vars: { "--dur": "25s", "--dl": "-15s", "--dx": "18px", "--dy": "16px", "--dr": "70deg" } },
] as const;

/**
 * Hero, desktop only: the bouquet behind the top-right of the headline (the copy column is the positioning
 * context; z-index -1 keeps it behind the headline's paper strips) + three petals drifting very slowly.
 */
export function HeroCrown() {
  return (
    <div aria-hidden="true" className="fl-load pointer-events-none absolute -top-4 right-[-90px] z-[5] hidden w-[calc(22cqi+90px)] lg:block">
      <CrownArt className="block h-auto w-full" />
      {FLOATS.map((f) => (
        <span key={f.cls} className={`fl-float ${f.cls}`} style={v(f.vars)}>
          <svg viewBox="-14 -44 28 46" className="block h-auto w-full" focusable="false">
            <use href={href(ID.tepalD)} fill={f.fill} />
          </svg>
        </span>
      ))}
    </div>
  );
}

/**
 * Hero photo plate flowers (positioned in the plate's `relative` wrapper, before the credential tags):
 * - phones/tablets: a compact bloom over the plate's lower-right, above the tags (no layout impact);
 * - desktop: a cluster behind the plate (z-index -1), bursting out past its lower-left corner.
 */
export function HeroPlateBlooms() {
  return (
    <>
      <div aria-hidden="true" className="fl-load pointer-events-none absolute right-1.5 bottom-[128px] w-[88px] sm:right-6 sm:bottom-5 sm:w-[150px] lg:hidden">
        <PlateBloomArt className="block h-auto w-full" />
      </div>
      <div aria-hidden="true" className="fl-load pointer-events-none absolute -bottom-[76px] -left-[150px] z-[-1] hidden w-[280px] lg:block">
        <PlateBurstArt className="block h-auto w-full" />
      </div>
    </>
  );
}

/** Flower-garland divider between sections: blooms open once when it scrolls into view. */
export function FloralDivider({ variant = "crocus" }: { variant?: "crocus" | "trio" }) {
  return (
    <Fx className="fl-garland fl-reveal relative z-[1] -my-10 flex justify-center px-4 md:-my-14">
      <GarlandArt variant={variant} className="block h-auto w-full max-w-[640px]" />
    </Fx>
  );
}
