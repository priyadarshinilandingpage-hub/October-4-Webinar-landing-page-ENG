// Public webinar facts. Safe to import from client or server. NEVER put secrets here.
// The payment amount below is the single source of truth: the server charges exactly this.

export const OFFER = {
  title: "Live Webinar: Start Small, Invest Smart, Build Wealth",
  host: "Priyadharsini Subramaniam",
  /** Amount in INR, charged by the server. The browser never sends a price. */
  priceInr: 99,
  currency: "INR",
  /** Session start in IST. TODO(client): confirm the start time. */
  startsAtIso: "2026-10-04T11:00:00+05:30",
  dateLabel: "Sunday, 4 October 2026",
  language: "Tamil",
} as const;

export const ORDER_AMOUNT = OFFER.priceInr.toFixed(2); // "99.00"
/** The same price in paise, the unit Razorpay uses. */
export const AMOUNT_PAISE = Math.round(OFFER.priceInr * 100); // 9900

/** "11:00 AM IST", read straight from the ISO time so it never depends on the server's time zone. */
export function startTimeLabel(iso: string = OFFER.startsAtIso): string {
  const [h, m] = iso.slice(11, 16).split(":").map(Number) as [number, number];
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} IST`;
}