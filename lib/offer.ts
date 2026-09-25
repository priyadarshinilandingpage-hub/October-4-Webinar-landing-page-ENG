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

/** "11:00 AM IST", read straight from the ISO time so it never depends on the server's time zone. */
export function startTimeLabel(iso: string = OFFER.startsAtIso): string {
  const [h, m] = iso.slice(11, 16).split(":").map(Number) as [number, number];
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} IST`;
}

/** Session length in minutes, for calendar invites. TODO(client): confirm the session length (the plan says about 2 hours). */
export const SESSION_MINUTES = 120;

/** Google Calendar "add event" link for the session. */
export function calendarUrl(): string {
  const start = new Date(OFFER.startsAtIso);
  const end = new Date(start.getTime() + SESSION_MINUTES * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: OFFER.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Live ${OFFER.language} webinar with ${OFFER.host}. Joining link: sent on email/WhatsApp.`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}