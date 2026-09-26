"use client";

import { useEffect } from "react";
import { OFFER } from "@/lib/offer";

// Meta Pixel for ad measurement: PageView on every page, InitiateCheckout when the form opens Razorpay,
// Purchase on a verified thank-you page. Active only when NEXT_PUBLIC_META_PIXEL_ID is set at build time
// (scripts/write-headers.mjs then opens the CSP for Meta's hosts). No personal data goes through the browser Pixel: the
// server sends hashed email/phone for purchases (server/meta-capi.ts), matched by the same event id.
// Meta's script (about 90 KB) loads only after the page has finished loading and gone idle, so the hero
// and the ₹99 form are never slowed down; calls made before that wait in the queue below.

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

let initialised = false;
let pageViewSent = false;

/** The same queue stub as Meta's official snippet, then init once. */
function ensure(): Fbq | undefined {
  if (!PIXEL_ID || typeof window === "undefined") return undefined;
  if (!window.fbq) {
    const q = function (this: unknown) {
      // eslint-disable-next-line prefer-rest-params
      const args = arguments;
      if (q.callMethod) q.callMethod(...args);
      else q.queue.push(args);
    } as unknown as Fbq;
    q.push = q;
    q.loaded = true;
    q.version = "2.0";
    q.queue = [];
    window.fbq = q;
    if (!window._fbq) window._fbq = q;
  }
  if (!initialised) {
    window.fbq("init", PIXEL_ID);
    initialised = true;
  }
  return window.fbq;
}

export type PixelEventName = "PageView" | "InitiateCheckout" | "Purchase";

/** Sends a standard event. `eventId` lets Meta merge it with the server's copy of the same event. */
export function track(event: PixelEventName, params?: Record<string, unknown>, eventId?: string) {
  ensure()?.("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}

export const checkoutValue = { value: OFFER.priceInr, currency: OFFER.currency } as const;

/** Mounted once in the root layout. */
export function MetaPixel() {
  useEffect(() => {
    if (!PIXEL_ID) return;
    if (!pageViewSent) {
      track("PageView");
      pageViewSent = true;
    }
    const load = () => {
      if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
      const s = document.createElement("script");
      s.async = true;
      s.src = SCRIPT_SRC;
      document.head.appendChild(s);
    };
    const whenIdle = () => {
      if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 4_000 });
      else setTimeout(load, 1_500);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
  }, []);
  return null;
}

/** Fires one event when a page mounts, once per browser tab session (reloads don't repeat it). */
export function PixelEvent({ event, eventId, value }: { event: "Purchase"; eventId: string; value: number }) {
  useEffect(() => {
    if (!PIXEL_ID) return;
    const key = `px:${event}:${eventId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    track(event, { value, currency: OFFER.currency, content_name: "webinar" }, eventId);
  }, [event, eventId, value]);
  return null;
}
