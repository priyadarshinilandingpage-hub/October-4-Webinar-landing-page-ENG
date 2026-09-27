"use client";

import { useEffect, useId, useRef, useState } from "react";
import { WA_KEY } from "@/lib/already-paid";
import { USER_FIELDS, leadSchema } from "@/lib/validation";
import { CHECKOUT } from "./content";
import { Lock, ThreadArrow } from "./icons";
import { checkoutValue, track } from "./MetaPixel";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string; field?: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";

/** What POST /api/orders returns (server/routes/orders.ts). Everything here is safe for the browser. */
interface OrderResponse {
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name: string; email: string; contact: string };
  callbackUrl?: string;
  alreadyPaid?: boolean;
  /** Only with alreadyPaid: the buyers' WhatsApp group link, shown on /already-paid. */
  whatsapp?: string;
  error?: string;
  field?: string;
}

type RazorpayCtor = new (options: Record<string, unknown>) => { open: () => void };
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";
let checkoutScript: Promise<RazorpayCtor> | undefined;

/** Razorpay's official checkout script, loaded once, only when someone actually pays. */
function loadRazorpay(): Promise<RazorpayCtor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  checkoutScript ??= new Promise<RazorpayCtor>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_JS;
    s.async = true;
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("no Razorpay")));
    s.onerror = () => {
      checkoutScript = undefined;
      s.remove();
      reject(new Error("load failed"));
    };
    document.head.appendChild(s);
  });
  return checkoutScript;
}

/** Only the visible fields get inline errors; anything else (bot traps, utm) gets a generic message. */
function userField(f: unknown): string | undefined {
  const name = String(f ?? "");
  return (USER_FIELDS as readonly string[]).includes(name) ? name : undefined;
}

function readUtm() {
  const p = new URLSearchParams(window.location.search);
  const clean = (v: string | null) => (v ? v.replace(/[^A-Za-z0-9_.\- ]/g, "").slice(0, 60) : undefined);
  const source = clean(p.get("utm_source")) ?? (p.has("fbclid") ? "meta" : undefined);
  return { utmSource: source, utmCampaign: clean(p.get("utm_campaign")), utmContent: clean(p.get("utm_content")) };
}

/**
 * Lead form → server creates a fixed-price Razorpay order → Razorpay's official checkout. No PII is stored in the
 * browser. Styled as a numbered application form (styles: .fj-form in app/sections.css).
 */
export function CheckoutForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const openedAt = useRef(0);
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const fid = (f: string) => `${uid}-${f}`;

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  /** Move keyboard/screen-reader focus to the field that needs fixing. */
  function focusField(field?: string) {
    if (!field) return;
    const el = formRef.current?.elements.namedItem(field);
    if (el instanceof HTMLInputElement) el.focus();
  }

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (busy.current) return; // one order per click
    const form = new FormData(ev.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      consent: form.get("consent") === "on",
      marketingConsent: form.get("marketingConsent") === "on",
      website: String(form.get("website") ?? ""),
      elapsedMs: Math.min(Date.now() - openedAt.current, 86_400_000),
      ...readUtm(),
    };

    const check = leadSchema.safeParse(input);
    if (!check.success) {
      const issue = check.error.issues[0];
      const field = userField(issue?.path[0]);
      setStatus({ kind: "error", message: field ? (issue?.message ?? "Please check your details") : GENERIC_ERROR, field });
      focusField(field);
      return;
    }

    busy.current = true;
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as OrderResponse;
      // This email or WhatsApp number already has a paid seat: no second payment, show the group button again.
      if (data.alreadyPaid) {
        try {
          if (data.whatsapp) sessionStorage.setItem(WA_KEY, data.whatsapp);
        } catch {}
        window.location.assign("/already-paid");
        return;
      }
      if (!res.ok || !data.orderId || !data.keyId || !data.callbackUrl) {
        throw Object.assign(new Error(data.error ?? GENERIC_ERROR), { field: userField(data.field) });
      }
      const Razorpay = await loadRazorpay().catch(() => {
        throw new Error("Payment window couldn't open. Please check your connection and try again.");
      });
      track("InitiateCheckout", checkoutValue);
      // Redirect mode: after paying, Razorpay sends the buyer to our callback (then the thank-you page). This is
      // the reliable flow inside Instagram/Facebook's in-app browsers and for UPI apps.
      new Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        description: data.description,
        prefill: data.prefill,
        readonly: { email: true, contact: true },
        callback_url: data.callbackUrl,
        redirect: true,
        theme: { color: "#D9531E" },
        modal: {
          ondismiss: () => {
            busy.current = false;
            setStatus({ kind: "idle" });
          },
        },
      }).open();
    } catch (err) {
      busy.current = false;
      const field = (err as { field?: string }).field;
      setStatus({ kind: "error", message: (err as Error).message, field });
      focusField(field);
    }
  }

  const errorFor = (f: string) => (status.kind === "error" && status.field === f ? status.message : undefined);
  const invalid = (f: string) => (errorFor(f) ? true : undefined);
  const describedBy = (f: string) => (errorFor(f) ? fid(`${f}-err`) : undefined);
  const loading = status.kind === "loading";
  const fieldError = status.kind === "error" && Boolean(status.field);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="fj-form" aria-describedby="checkout-status">
      <div className="fj-fields">
        <div className="fj-field">
          <label htmlFor={fid("name")}>
            <span className="fj-fieldno" aria-hidden="true">
              01
            </span>
            {CHECKOUT.name}
          </label>
          <input
            id={fid("name")}
            name="name"
            autoComplete="name"
            required
            maxLength={60}
            placeholder={CHECKOUT.namePh}
            enterKeyHint="next"
            aria-invalid={invalid("name")}
            aria-describedby={describedBy("name")}
          />
          <FieldError id={fid("name-err")} message={errorFor("name")} />
        </div>
        <div className="fj-field">
          <label htmlFor={fid("email")}>
            <span className="fj-fieldno" aria-hidden="true">
              02
            </span>
            {CHECKOUT.email}
          </label>
          <input
            id={fid("email")}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={100}
            placeholder={CHECKOUT.emailPh}
            enterKeyHint="next"
            aria-invalid={invalid("email")}
            aria-describedby={describedBy("email")}
          />
          <FieldError id={fid("email-err")} message={errorFor("email")} />
        </div>
        <div className="fj-field">
          <label htmlFor={fid("phone")}>
            <span className="fj-fieldno" aria-hidden="true">
              03
            </span>
            {CHECKOUT.phone}
          </label>
          <input
            id={fid("phone")}
            name="phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            required
            maxLength={20}
            placeholder={CHECKOUT.phonePh}
            enterKeyHint="done"
            aria-invalid={invalid("phone")}
            aria-describedby={describedBy("phone")}
          />
          <FieldError id={fid("phone-err")} message={errorFor("phone")} />
        </div>
      </div>

      {/* Honeypot: hidden from people, bots fill it. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="fj-checks">
        <label className="fj-check">
          <input type="checkbox" name="consent" required aria-invalid={invalid("consent")} aria-describedby={describedBy("consent")} />
          <span>
            {CHECKOUT.consentBefore}
            <a href="/privacy">Privacy Policy</a> and <a href="/refund">Refund Policy</a>.
          </span>
        </label>
        {errorFor("consent") && <FieldError id={fid("consent-err")} message={errorFor("consent")} className="pl-[42px]" />}
        <label className="fj-check">
          <input type="checkbox" name="marketingConsent" />
          <span>{CHECKOUT.marketing}</span>
        </label>
      </div>

      <button type="submit" className="btn btn-saffron fj-submit" disabled={loading} aria-busy={loading || undefined}>
        {loading ? (
          <>
            <span className="fj-spinner" aria-hidden="true" />
            <span>{CHECKOUT.loading}</span>
          </>
        ) : (
          <>
            <span>{CHECKOUT.button}</span>
            <ThreadArrow className="thread-arrow" />
          </>
        )}
      </button>

      {/* Live region: always announces the error; shown visually only when it isn't already under a field. */}
      <p id="checkout-status" role="status" aria-live="polite" className={`fj-status ${fieldError ? "sr-only" : ""}`}>
        {status.kind === "error" ? status.message : ""}
      </p>

      <p className="fj-trust">
        <span className="fj-stamp fj-stamp--violet fj-stamp--sm">
          <Lock className="size-3.5 shrink-0" />
          {CHECKOUT.stamp}
        </span>
        <span>{CHECKOUT.methods}</span>
      </p>
    </form>
  );
}

function FieldError({ id, message, className = "" }: { id: string; message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={`fj-ferr ${className}`}>
      {message}
    </p>
  );
}
