/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ALL PAGE COPY + MEDIA SLOTS LIVE IN THIS FILE.
 *  Edit words here; the section components only handle layout.
 *  Price / date / time always come from lib/offer.ts (never hard-code them).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  MEDIA TODO LIST: drop each file into /public at EXACTLY this path, then flip
 *  its `ready` flag below from `false` to `true`. Until then a soft placeholder
 *  box (labelled with the filename) is shown instead of a broken image.
 *
 *   slot                  file (under /public)                        used in
 *   ───────────────────   ─────────────────────────────────────────   ─────────────────
 *   heroPortrait          /media/hero/hero-portrait.jpg               Hero (LCP image)
 *   heroLoop              /media/hero/hero-loop.mp4 (+ hero-loop.jpg)  Hero inset
 *   farmSetup             /media/farm/farm-setup-wide.mp4             Farm bento
 *   farmBloom             /media/farm/saffron-bloom-closeup.mp4       Farm bento
 *   farmHarvest           /media/farm/harvest-stigma.mp4              Farm bento
 *   farmJar               /media/farm/saffron-jar.jpg                 Farm bento
 *   farmCorms             /media/farm/corms-trays.jpg                 Farm bento
 *   expoStall             /media/proof/expo-madurai-stall.jpg         Farm bento
 *   ediitnSpeaking        /media/proof/ediitn-speaking.jpg            About
 *   day02 / day15 / day58 /media/journey/day-02.mp4, day-15.mp4, day-58.mp4   Journey timeline
 *   reviews[0..9]         /media/reviews/review-01.png … review-10.png Reviews wall
 *   aboutPortrait         /media/about/about-portrait.jpg             About
 *   intro                 /media/intro/intro-60s.mp4 (+ intro-60s.jpg) About (with sound + controls)
 *   AI_ART.*              /media/ai/<name>.jpg  (names TBD)            Optional decoration: hidden when missing
 *
 *  CLIENT INPUT STILL NEEDED (search this file for "TODO(client)"):
 *   - Start time (lib/offer.ts startsAtIso), platform (Zoom/Meet/YouTube), replay yes/no
 *   - Bonuses (BONUSES array is empty on purpose; nothing is shown until she confirms)
 *   - Review screenshots + permission from each attendee
 *   - Approve the pull-quote, the PS, the journey captions, the FAQ answers
 */
import { OFFER } from "@/lib/offer";

/* ───────────────────────── Media slots ───────────────────────── */

export type MediaSlot = {
  kind: "image" | "video";
  /** Public path the file is expected at. */
  expected: string;
  /** Set only when the file really exists (via `ready`). */
  src?: string;
  poster?: string;
  /** Dark-theme version (AI clips are rendered on each theme's own flat background). */
  srcDark?: string;
  posterDark?: string;
  alt: string;
  /** Intrinsic size for images shown at natural aspect (reviews). */
  width?: number;
  height?: number;
  /** Optional decoration: render nothing (not a placeholder) when missing. */
  optional?: boolean;
};

function img(path: string, alt: string, ready: boolean, extra: Partial<MediaSlot> = {}): MediaSlot {
  return { kind: "image", expected: path, src: ready ? path : undefined, alt, ...extra };
}

/** `posterReady` = the matching .jpg poster exists too. */
function vid(path: string, alt: string, ready: boolean, posterPath?: string, posterReady = false): MediaSlot {
  return {
    kind: "video",
    expected: path,
    src: ready ? path : undefined,
    poster: ready && posterReady ? posterPath : undefined,
    alt,
  };
}

/** An AI illustration loop rendered twice (light + dark background), swapped by the theme. */
function aiLoop(base: string, alt: string, extra: Partial<MediaSlot> = {}): MediaSlot {
  return {
    kind: "video",
    expected: `/media/ai/${base}-light.mp4`,
    src: `/media/ai/${base}-light.mp4`,
    poster: `/media/ai/${base}-light.jpg`,
    srcDark: `/media/ai/${base}-dark.mp4`,
    posterDark: `/media/ai/${base}-dark.jpg`,
    alt,
    ...extra,
  };
}

export const MEDIA = {
  heroPortrait: img("/media/hero/hero-portrait.jpg", "Portrait of Priyadharsini Subramaniam, startup strategist and saffron farm founder", true),
  // Smaller encode of the hero loop for the little pasted-on print in the hero (phones + desktop).
  heroLoopSmall: vid("/media/hero/hero-loop-small.mp4", "Priyadharsini sliding wooden trays into the racks of her indoor saffron grow room", true, "/media/hero/hero-loop-small.jpg", true),
  heroLoop: vid("/media/hero/hero-loop.mp4", "Priyadharsini sliding wooden trays into the racks of her indoor saffron grow room", true, "/media/hero/hero-loop.jpg", true),

  farmSetup: vid("/media/farm/farm-setup-wide.mp4", "Inside her insulated grow room: cooling units above rows of red and blue racks", true, "/media/farm/farm-setup-wide.jpg", true),
  // AI illustration (not footage): she has not filmed a bloom yet. Captioned as an illustration on the page.
  farmBloom: aiLoop("ai-crocus-bloom", "Illustration of saffron crocus flowers, Crocus sativus"),
  farmHarvest: vid("/media/farm/harvest-stigma.mp4", "Her hands sorting red saffron threads with tweezers", true, "/media/farm/harvest-stigma.jpg", true),
  farmJar: img("/media/farm/saffron-jar.jpg", "Gloved hands filling small jars with dried saffron threads", true),
  farmCorms: img("/media/farm/corms-trays.jpg", "Two saffron corms held up close in her hands", true),
  expoStall: img("/media/proof/expo-madurai-stall.jpg", "Her saffron stall at the United Agritech 2026 expo in Madurai", true),
  ediitnSpeaking: img("/media/proof/ediitn-speaking.jpg", "Priyadharsini speaking as a resource person at EDII-TN", false, { optional: true }),

  day02: vid("/media/journey/day-02.mp4", "Saffron threads turning a glass of water golden during a purity test", true, "/media/journey/day-02.jpg", true),
  day15: vid("/media/journey/day-15.mp4", "Priyadharsini walking into the empty room that became her grow room", true, "/media/journey/day-15.jpg", true),
  day58: vid("/media/journey/day-58.mp4", "Priyadharsini in goggles welding the metal racks for her grow room", true, "/media/journey/day-58.jpg", true),

  aboutPortrait: img("/media/about/about-portrait.jpg", "Portrait of Priyadharsini Subramaniam", true),
  // The general (authority) ad creative, with sound + controls.
  intro: vid("/media/creatives/general.mp4", "Priyadharsini on the saffron farm she is building and the 4 October webinar", true, "/media/creatives/general.jpg", true),
} satisfies Record<string, MediaSlot>;

/**
 * Review screenshots. Flip `ready` per file. Set width/height to the real pixel size
 * so the masonry wall keeps each screenshot's shape.
 * TODO(client): only publish screenshots the attendee agreed to share (blur names/faces otherwise).
 */
const REVIEW_HEIGHTS = [1968, 2005, 2005, 1414, 2005]; // redacted WhatsApp screenshots, 1080 px wide each
export const REVIEWS: MediaSlot[] = REVIEW_HEIGHTS.map((height, i) => {
  const n = String(i + 1).padStart(2, "0");
  return img(`/media/reviews/review-${n}.png`, `WhatsApp feedback from attendees of her previous webinar (${i + 1} of 5)`, true, { width: 1080, height });
});

/** AI illustrations (assets-inbox/AI-IMAGE-PROMPTS.md + AI-VIDEO-PROMPTS.md). Decorative: the text next to them says the same. */
export const AI_ART = {
  problem: img("/media/ai/ai-problem-ledger.png", "", true, { optional: true }),
  modules: [1, 2, 3, 4, 5, 6].map((n) => aiLoop(`ai-module-0${n}`, "", { optional: true })),
};

/* ───────────────────────── Event facts (derived from lib/offer.ts) ───────────────────────── */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const iso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(OFFER.startsAtIso);
const [yy, mo, dd, hh, mi] = iso ? [+iso[1], +iso[2], +iso[3], +iso[4], iso[5]] : [2026, 10, 4, 11, "00"];

/** Deterministic labels (same on server and client, no locale/ICU surprises). */
export const EVENT = {
  price: `₹${OFFER.priceInr}`,
  dateLabel: OFFER.dateLabel,
  shortDate: `${DAYS[new Date(Date.UTC(yy, mo - 1, dd)).getUTCDay()]}, ${dd} ${MONTHS[mo - 1]}`,
  dayMonth: `${dd} ${MONTHS[mo - 1]}`,
  dayMonthLong: `${dd} ${MONTHS_LONG[mo - 1]}`,
  // startsAtIso is written in IST (+05:30), so the wall-clock time can be read straight from it.
  timeLabel: `${((hh + 11) % 12) + 1}:${mi} ${hh < 12 ? "AM" : "PM"} IST`,
  year: yy,
  language: OFFER.language,
  host: OFFER.host,
  title: OFFER.title,
  // TODO(client): confirm platform. Keep it generic until then.
  platform: "Online, live",
  platformNote: "Joining link shared in the buyers' WhatsApp group",
};

/* ───────────────────────── Brand ───────────────────────── */

export const BRAND = {
  name: "Priyadharsini",
  tagline: "Saffron & Business",
  instagram: "@priyadharsini_subramaniam_",
};

/* ───────────────────────── Top bar + sticky CTA ───────────────────────── */

export const NAV = {
  liveLabel: `Live · ${EVENT.shortDate} · ${EVENT.timeLabel} · ${EVENT.language}`,
  // CtaLink splits "label · ₹99" into the label and the stamped price stub.
  cta: `Register · ${EVENT.price}`,
  mobileTitle: EVENT.price,
  mobileSub: `Live Tamil webinar · ${EVENT.shortDate}`,
  mobileCta: "Reserve seat",
};

/* ───────────────────────── Hero (message-matched to the two Meta ads) ───────────────────────── */

type Segment = { t: string; em?: boolean };
/**
 * title/sub = desktop (full ad line). short/shortSub = phones: the first screen is image-first,
 * so the headline stays ≤ 8 words and the support is one short line.
 */
export type HeroCopy = { title: Segment[]; short: Segment[]; sub: string; shortSub: string; detail: string; evenIf: string };

/**
 * HERO MEDIA (image-first hero). The big plate is the LCP image.
 * To switch on a real photo: point `stage` at the file and pass ready=true, e.g.
 *   stage: img("/media/instagram/profile.jpg", "Priyadharsini Subramaniam at her indoor saffron farm", true),
 * Best: a portrait of her at/inside the farm, 4:5 or taller, ≥1200px tall. `stageFocus` = CSS object-position
 * (keep her face in frame on phones, where the plate is cropped wider). `inset` = optional second plate on
 * desktop (a farm reel cover or loop); it is hidden until ready.
 */
export const HERO_MEDIA = {
  stage: MEDIA.heroPortrait,
  stageFocus: "50% 24%",
  // Her at work in the grow room: "what she has built", next to her portrait on every screen size.
  inset: { ...MEDIA.heroLoopSmall, optional: true } as MediaSlot,
  // Her Instagram profile photo (150×150: avatar-size only, too small for the stage). Shown on the 39.4K tag.
  avatar: img("/media/instagram/profile.jpg", "Priyadharsini's Instagram profile photo", true, { optional: true }),
};

export const HERO_SHARED = {
  eyebrow: ["Live Tamil webinar", EVENT.shortDate, EVENT.timeLabel],
  cta: `Ippove register pannunga · ${EVENT.price}`,
  trust: "Secure checkout by Razorpay · UPI, cards & netbanking",
  countdownLabel: "Starts in",
  /** Authority tags pinned on the hero photo (verified facts only). */
  badges: [
    { value: "39.4K", label: "on Instagram" },
    { value: "Day 58+", label: "building the farm live" },
    { value: "EDII", label: "Ahmedabad alumna" },
    { value: "5+ yrs", label: "in agribusiness" },
  ],
  figLabel: "Kunguma poo farm · Tamil Nadu",
  figCaption: "Her indoor saffron (kunguma poo) farm in Tamil Nadu: planned, invested in and built step by step, shared daily on Instagram.",
  insetCaption: "Indoor saffron grow room",
  /** Rubber postmark on the photo. */
  stamp: { ring: `LIVE · TAMIL WEBINAR · ${EVENT.dayMonth.toUpperCase()} ${EVENT.year} · `, center: EVENT.price, sub: "ONLY" },
  noteLabel: "Margin note",
};

export const HERO: Record<"a" | "b", HeroCopy> = {
  // utm_content=creative_a, or no/unknown utm (investor angle)
  a: {
    title: [{ t: "Naan epdi invest panni " }, { t: "Kunguma Poo farm", em: true }, { t: " build panen." }],
    short: [{ t: "Epdi invest panni " }, { t: "Kunguma Poo farm", em: true }, { t: " build panen." }],
    shortSub: "Unga business-kum adhe plan. Live-aa solli tharen.",
    sub: "Adhe madhiri, unga money-a smart-aa invest panni unga business-ku capital & wealth build panradhu epdi-nu live-aa solli tharen.",
    detail:
      "One live session in Tamil on investment planning, capital management, profitability, market opportunities, and loans & subsidies. Start small, grow step by step, build long-term wealth,",
    evenIf: "even if you've never run a business and don't have big capital.",
  },
  // utm_content=creative_b (women angle)
  b: {
    title: [{ t: "Oru woman-aa business start panna " }, { t: "periya investment-um, periya space-um", em: true }, { t: " thevai illa." }],
    short: [{ t: "Woman-aa business start panna " }, { t: "periya investment", em: true }, { t: " thevai illa." }],
    shortSub: "Small-aa start, smart-aa invest. Live-aa solli tharen.",
    sub: "Small scale-la start pannunga. Smart-aa invest pannunga. Wealth build pannunga. Epdi-nu live-aa solli tharen.",
    detail:
      `I'm building an indoor saffron farm in Tamil Nadu. On ${EVENT.dayMonthLong} I'll share the same practical approach: investment planning, capital management, profitability, market opportunities, and loans & subsidies,`,
    evenIf: "even if you're starting from home with small savings.",
  },
};

/* ───────────────────────── Proof marquee (verified facts only) ───────────────────────── */

export const PROOF_MARQUEE = [
  "Startup Strategist",
  "Alumna · EDII Ahmedabad",
  "Alumna · TNAU",
  "Resource Person · EDII-TN",
  "Specialisation · New Enterprise Creation",
  "5+ years in agribusiness",
  "Exhibited · United Agritech 2026, Madurai",
  "39.4K on Instagram",
  "Indoor saffron farm · Tamil Nadu",
];

/* ───────────────────────── "This is my farm" bento ───────────────────────── */

export const FARM = {
  kicker: "Proof, not theory",
  title: "Idhu theory illa. Idhu en farm.",
  lead: "An indoor saffron (kunguma poo) farm in Tamil Nadu, planned, funded and built step by step. The money lessons behind it are what you'll learn.",
  tiles: {
    setup: { media: MEDIA.farmSetup, caption: "The indoor grow room" },
    bloom: { media: MEDIA.farmBloom, caption: "The crop: Crocus sativus (illustration)" },
    harvest: { media: MEDIA.farmHarvest, caption: "Sorting saffron threads by hand" },
    jar: { media: MEDIA.farmJar, caption: "Packing the dried saffron" },
    corms: { media: MEDIA.farmCorms, caption: "Checking the corms" },
    expo: { media: MEDIA.expoStall, caption: "United Agritech 2026, Madurai" },
  },
  stat: { value: "Day 58+", label: "and counting, shared daily on Instagram" },
  note: { title: "What this proves", body: "She planned the capital and built a real business, in public." },
};

/* ───────────────────────── Problem: two-column contrast ───────────────────────── */

export const PROBLEM = {
  kicker: "The real problem",
  title: "Problem panam illa. Plan illadhadhu dhaan.",
  lead: "Big capital isn't what's missing. A clear plan for your money is.",
  // Ledger columns: what most people do vs what you'll do after the session. Rows pair up 1:1.
  beforeTitle: "Most people…",
  before: [
    "Wait for “big money”, and never start.",
    "Put all their savings into one idea.",
    "Run out of cash in the first few months.",
    "Don't know which loans or subsidies exist.",
    "Build first, then go looking for buyers.",
  ],
  afterTitle: `After ${EVENT.dayMonth}, you…`,
  after: [
    "Start small with the money you already have.",
    "Know what to spend on first, and what can wait.",
    "Follow simple monthly rules that protect your cash.",
    "Know which loans & subsidies to apply for, and how.",
    "Check people will buy before you invest a rupee.",
  ],
  balanceLabel: "Balance",
  balance: "A clear plan for your money.",
};

/* ───────────────────────── 6 modules ───────────────────────── */

export const MODULES = {
  kicker: `What you'll learn · ${EVENT.dayMonth}`,
  title: "6 modules. Simple words. Practical steps.",
  lead: "No jargon. Each module ends with something you can do the very next day.",
  swipeHint: "Swipe",
  itemLabel: "module",
  items: [
    { n: "01", tag: "How to start a business", title: "Idea → Plan", body: "Turn “I want to start something” into a clear 30-day action plan." },
    { n: "02", tag: "Investment planning", title: "How much money, really?", body: "What to spend on first, and what can wait." },
    { n: "03", tag: "Capital management", title: "Don't run out of cash", body: "Simple monthly money rules that keep the business breathing." },
    { n: "04", tag: "Market opportunities", title: "Who will buy?", body: "Find the demand before you invest a rupee." },
    { n: "05", tag: "Loans & govt subsidies", title: "Free & cheap money", body: "Loans and subsidies you can actually apply for, and how." },
    { n: "06", tag: "Growth & wealth creation", title: "From one unit to wealth", body: "Grow the profit, then turn it into long-term wealth." },
  ],
};

/* ───────────────────────── Journey timeline ───────────────────────── */

// TODO(client): confirm each caption matches what the reel actually shows.
export const JOURNEY = {
  kicker: "Building it in public",
  title: "Day 2 → Day 58+.",
  titleEm: "Every step on Instagram.",
  lead: `Her daily “Day X” series on ${BRAND.instagram} shows the farm being built, one day at a time.`,
  items: [
    { day: "27 Jun", title: "Learning real saffron", body: "The purity test: real threads turn water golden.", media: MEDIA.day02 },
    { day: "6 Jul", title: "An empty room", body: "The space that would become the grow room.", media: MEDIA.day15 },
    { day: "14 Aug", title: "Building it herself", body: "Welding the racks, one by one.", media: MEDIA.day58 },
  ],
  // Gaps between diary entries (plain arithmetic on the day numbers above; the last one leads to the webinar).
  gaps: ["+9 days", "+39 days", "next"],
  finale: {
    day: EVENT.dayMonth,
    stamp: "Live",
    title: "Your turn",
    body: "How she planned the money, and how you can do the same.",
  },
  cta: `Save my seat · ${EVENT.price}`,
};

/* ───────────────────────── Value stack (receipt) ───────────────────────── */

/**
 * TODO(client): bonuses are EMPTY on purpose. Add only what she will really deliver, e.g.
 *   { label: "Saffron startup cost checklist (PDF)" },
 *   { label: "Loan & subsidy document checklist" },
 *   { label: "Replay for 48 hours" },
 */
export const BONUSES: { label: string }[] = [];

export const VALUE = {
  kicker: "Everything in your seat",
  title: "Unga seat-la enna irukku?",
  lead: `${EVENT.price} keeps it an easy yes, and keeps the room full of people who are serious about acting.`,
  mainLine: "Live Tamil webinar with Priyadharsini",
  mainSub: `${EVENT.dateLabel} · ${EVENT.timeLabel}`,
  colItem: "Item",
  colStatus: "In your seat",
  included: "Included",
  strikeLabel: "Learning it by trial & error",
  strikeValue: "years + lakhs",
  totalLabel: "Total today",
  totalNote: "One-time · no subscription",
  // Round rubber postmark around the price (text runs along the ring; ~34 characters fills it).
  stampRing: `Live ${EVENT.language} webinar · ${EVENT.dayMonth} ${EVENT.year} ·`,
  stampSub: "One-time",
  cta: `Reserve my seat · ${EVENT.price}`,
};

/* ───────────────────────── Join / payment (#join) ───────────────────────── */

export const JOIN = {
  kicker: "Reserve your seat",
  // Echoes the ad the visitor clicked (utm_content).
  title: {
    a: "Unga money-a grow panna ready-aa?",
    b: "Small-aa start pannalam. Ready-aa?",
  },
  lead: "Seat-a ippove book pannunga. It takes under a minute.",
  countdownLabel: "Session starts in",
  stepsTitle: "What happens next",
  steps: [
    `Fill in your details and pay ${EVENT.price} on Razorpay's secure page.`,
    "Tap the WhatsApp button on the confirmation page to join the group.",
    `Join live on ${EVENT.shortDate} at ${EVENT.timeLabel}.`,
  ],
  backLink: "New here? See who's teaching",
  card: {
    eyebrow: "Live Tamil webinar",
    form: "Seat reservation",
    when: `${EVENT.shortDate} · ${EVENT.timeLabel}`,
    priceNote: "One-time payment · no subscription",
  },
};

/** Wording used inside components/CheckoutForm.tsx (data contract stays in that file). */
export const CHECKOUT = {
  name: "Your name",
  namePh: "e.g. Priya",
  email: "Email",
  emailPh: "you@example.com",
  phone: "WhatsApp number",
  phonePh: "10-digit mobile",
  consentBefore: "I agree that my name, email and WhatsApp number are used to register me for this webinar and send the joining details. See ",
  marketing: "(Optional) Send me future updates and offers. I can unsubscribe anytime.",
  button: `Reserve my seat · ${EVENT.price}`,
  loading: "Opening secure payment…",
  note: "Secure payment by Razorpay · UPI, cards, netbanking",
  // The trust line, set as a small rubber stamp under the button.
  stamp: "Secured by Razorpay",
  methods: "UPI · Cards · Netbanking",
};

/* ───────────────────────── Reviews ───────────────────────── */

export const REVIEWS_COPY = {
  kicker: "Webinar reviews",
  title: "Don't take our word for it.",
  lead: "Real screenshots from attendees.",
  placeholder: "Review screenshot coming soon",
  cta: `Reserve your seat · ${EVENT.price}`,
};

/* ───────────────────────── For you / not for you ───────────────────────── */

export const FIT = {
  kicker: "Honest filter",
  title: "Idhu ungalukku-aa?",
  yesStamp: "For you",
  yesTitle: "This is for you if…",
  yes: [
    "You want to start a business without “big” capital.",
    "You have savings and want them to work, not sit idle.",
    "You're a homemaker, student or professional planning something of your own.",
    "You run a small business and want to grow without running out of cash.",
    "You want loans & subsidies explained in simple Tamil.",
  ],
  noStamp: "Not for you",
  noTitle: "This is NOT for you if…",
  no: [
    "You want a get-rich-quick scheme.",
    "You want guaranteed returns, or someone to hand you money.",
    "You won't act after the session.",
    "You only want a saffron-growing course. This is about business & money; the farm is the proof.",
  ],
};

/* ───────────────────────── About ───────────────────────── */

export const ABOUT = {
  kicker: "Meet your host",
  // Her own words from the webinar ad (lightly trimmed). TODO(client): approve.
  quote: "Small scale-la start panni, investment-a smart-aa use panni, business-a step by step grow panni, long-term wealth build pannalam.",
  quoteBy: `Priyadharsini, on what she'll teach on ${EVENT.dayMonthLong}`,
  name: "Priyadharsini Subramaniam",
  role: "Startup Strategist",
  idRows: [
    { label: "Project", value: "Indoor saffron farm" },
    { label: "Base", value: "Tamil Nadu" },
    { label: "Field", value: "Agribusiness · 5+ yrs" },
  ],
  bio: [
    "Startup strategist and Resource Person at EDII-TN. Alumna of EDII Ahmedabad and TNAU, specialised in New Enterprise Creation.",
    "Right now she's building an indoor saffron farm, and sharing every step in her daily “Day X” series. She also exhibited at United Agritech 2026, Madurai.",
  ],
  instagram: {
    handle: BRAND.instagram,
    url: "https://www.instagram.com/priyadharsini_subramaniam_/",
    label: "Follow the build",
  },
  credentials: [
    { label: "Alumna", value: "EDII Ahmedabad" },
    { label: "Alumna", value: "TNAU" },
    { label: "Resource Person", value: "EDII-TN" },
    { label: "Specialisation", value: "New Enterprise Creation" },
    { label: "Agribusiness", value: "5+ years" },
    { label: "Instagram", value: "39.4K followers" },
  ],
  introBadge: "37 sec",
  introTitle: "Hear it from her",
  introBody: "What she is building, what you'll learn on 4 October, and why it's just ",
};

/* ───────────────────────── FAQ ───────────────────────── */

export const FAQ = {
  kicker: "FAQ",
  title: "Questions? Answers.",
  lead: "Still unsure about something?",
  contactLabel: "Contact us",
  items: [
    { q: "What language is the webinar in?", a: `${EVENT.language}, with simple English words where needed. No jargon.` },
    { q: "When is it?", a: `${EVENT.dateLabel}, ${EVENT.timeLabel}. It's live, so please join on time.` },
    // TODO(client): name the platform (Zoom / Google Meet / YouTube Live).
    { q: "Where do I join?", a: "It's online. After you pay, you get a button to join the WhatsApp group, and the joining link is shared there." },
    {
      q: "Is this a saffron-farming course?",
      a: "No. It's about starting and growing a business with smart money decisions: planning, capital, market, loans & subsidies. Her saffron farm is the real-life example.",
    },
    {
      q: "I don't have big money or business experience. Is it still for me?",
      a: "Yes. The whole session is about starting small and growing step by step.",
    },
    // TODO(client): confirm replay policy, then update this answer.
    { q: "Will there be a replay?", a: "Please plan to attend live. Any replay details will be shared with registered attendees." },
    { q: `Why ${EVENT.price} and not free?`, a: "A small fee means the people who join are serious. That keeps the session focused and practical." },
    {
      q: "Is the payment safe?",
      a: "Yes. Payment happens on Razorpay's secure checkout (UPI, cards, netbanking). We never see your card or UPI details.",
    },
    { q: "I paid but didn't get the details. What now?", a: "Check your spam folder first. Still nothing? Contact us and we'll sort it out." },
  ],
  refundQ: "Can I get a refund?",
  refundA: "Please read our Refund Policy before you pay.",
  refundLink: "Read the Refund Policy",
};

/* ───────────────────────── Final ticket ───────────────────────── */

export const TICKET = {
  kicker: "About the webinar",
  title: "Your ticket to a smarter start.",
  rows: [
    { label: "Date", value: EVENT.dateLabel },
    { label: "Time", value: EVENT.timeLabel }, // TODO(client): confirm start time in lib/offer.ts
    { label: "Where", value: `${EVENT.platform} · ${EVENT.platformNote}` },
    { label: "Language", value: EVENT.language },
    { label: "Host", value: EVENT.host },
  ],
  stamp: "Live",
  stampRing: `Live · ${EVENT.language} · ${EVENT.shortDate.replace(",", "")} ${EVENT.year} · `,
  cta: `Register · ${EVENT.price}`,
  countdownLabel: "Starts in",
};

/* ───────────────────────── PS + footer ───────────────────────── */

// TODO(client): approve the PS wording.
export const PS = {
  body: `Skimmed everything? Here's the short version: on ${EVENT.dateLabel} at ${EVENT.timeLabel}, I'll show you live how I invested and built my saffron farm, and how you can start small, invest smart and grow your own business. Just ${EVENT.price}.`,
  close: "Ippove register pannunga. See you there.",
  sign: "Priyadharsini",
  cta: `Reserve my seat · ${EVENT.price}`,
};

export const FOOTER = {
  links: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
    { href: "/refund", label: "Refund Policy" },
    { href: "/contact", label: "Contact Us" },
  ],
  disclaimer:
    "This webinar is for education only. It is not financial or investment advice, and no income or returns are promised. Results depend on your own decisions and effort.",
  copyright: `© ${EVENT.year} ${EVENT.host}. All rights reserved.`,
};
