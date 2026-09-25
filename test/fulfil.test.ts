import { createVerify, generateKeyPairSync } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, mockFetch, ORDER_ID, paidOrder, sign, SITE } from "./helpers";

// Firestore + Resend follow-up after a verified payment, against an in-memory fake of both APIs.

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const WA = "https://chat.whatsapp.com/TestInviteCode123";
const OTHER_ORDER = "wb_ffffffffffffffffffffffffffffffff";

type Doc = Record<string, Record<string, unknown>>;
let docs: Map<string, Doc>;
let emails: { init: RequestInit; body: Record<string, unknown> }[];
let tokenCalls: string[];
let resendStatus: number;
let firestoreDown: boolean;

function fakeApis() {
  return mockFetch(async (url, init) => {
    if (url === "https://oauth2.googleapis.com/token") {
      tokenCalls.push(String(init.body));
      return jsonResponse({ access_token: "ya29.test", expires_in: 3600 });
    }
    if (url === "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token") {
      expect((init.headers as Record<string, string>)["Metadata-Flavor"]).toBe("Google");
      tokenCalls.push("metadata");
      return jsonResponse({ access_token: "ya29.test", expires_in: 3600 });
    }
    if (url === "https://api.resend.com/emails") {
      emails.push({ init, body: JSON.parse(String(init.body)) });
      return resendStatus === 200 ? jsonResponse({ id: `email_${emails.length}` }) : jsonResponse({ name: "error" }, resendStatus);
    }
    if (url.startsWith("https://graph.facebook.com/")) return jsonResponse({ events_received: 1 });
    const base = "https://firestore.googleapis.com/v1/projects/demo-webinar/databases/(default)/documents";
    if (!url.startsWith(base)) throw new Error(`unexpected fetch ${url}`);
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer ya29.test");
    if (firestoreDown) return jsonResponse({ error: { status: "UNAVAILABLE" } }, 503);
    const u = new URL(url);
    const path = decodeURIComponent(u.pathname).replace("/v1/projects/demo-webinar/databases/(default)/documents", "");
    const body = init.body ? JSON.parse(String(init.body)) : {};

    if (path === ":batchGet") {
      return jsonResponse(
        (body.documents as string[]).map((name) => {
          const d = docs.get(name.split("/documents")[1]!);
          return d ? { found: { name, fields: d } } : { missing: name };
        }),
      );
    }
    if (init.method === "POST") {
      const key = `${path}/${u.searchParams.get("documentId")}`;
      if (docs.has(key)) return jsonResponse({ error: { status: "ALREADY_EXISTS" } }, 409);
      docs.set(key, body.fields);
      return jsonResponse({ name: key, fields: body.fields });
    }
    if (init.method === "PATCH") {
      const d = docs.get(path);
      if (!d) return jsonResponse({ error: { status: "NOT_FOUND" } }, 404);
      docs.set(path, { ...d, ...body.fields });
      return jsonResponse({});
    }
    const d = docs.get(path);
    return d ? jsonResponse({ name: path, fields: d }) : jsonResponse({ error: { status: "NOT_FOUND" } }, 404);
  });
}

/** A fresh copy of the server modules: like a new server instance (empty caches), same Firestore. */
async function instance() {
  vi.resetModules();
  return {
    fulfil: await import("@/lib/fulfil"),
    buyers: await import("@/lib/buyers"),
    webhook: await import("@/app/api/webhooks/cashfree/route"),
  };
}

const row = () => docs.get(`/registrations/${ORDER_ID}`)!;

beforeEach(() => {
  docs = new Map();
  emails = [];
  tokenCalls = [];
  resendStatus = 200;
  firestoreDown = false;
  vi.stubEnv("FIREBASE_PROJECT_ID", "demo-webinar");
  vi.stubEnv("FIREBASE_CLIENT_EMAIL", "webinar-server@demo-webinar.iam.gserviceaccount.com");
  vi.stubEnv("FIREBASE_PRIVATE_KEY", PEM.replace(/\n/g, "\\n")); // as most dashboards store it
  vi.stubEnv("RESEND_API_KEY", "re_test_1234567890abcdef");
  vi.stubEnv("EMAIL_FROM", "Webinar <webinar@example.in>");
  vi.stubEnv("WEBINAR_WHATSAPP_URL", WA);
  fakeApis();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fulfilPaidOrder with Firestore + Resend", () => {
  it("adds one registrations row with readable columns and sends one email with the WhatsApp link", async () => {
    const { fulfil } = await instance();
    const order = paidOrder({ order_tags: { consent_marketing: "true", utm_source: "meta", utm_content: "creative_b" } });
    await expect(fulfil.fulfilPaidOrder(order as never)).resolves.toEqual({});

    expect(row()).toMatchObject({
      order_id: { stringValue: ORDER_ID },
      name: { stringValue: "Priya Raman" },
      email: { stringValue: "priya@example.com" },
      phone: { stringValue: "9876543210" },
      amount: { integerValue: "99" },
      currency: { stringValue: "INR" },
      status: { stringValue: "PAID" },
      mode: { stringValue: "sandbox" },
      webinar_date: { stringValue: "2026-10-04" },
      marketing_consent: { booleanValue: true },
      utm_source: { stringValue: "meta" },
      utm_content: { stringValue: "creative_b" },
      utm_campaign: { nullValue: null },
      duplicate_of: { nullValue: null },
      email_status: { stringValue: "sent" },
    });
    expect(row().email_sent_at).toHaveProperty("timestampValue");

    expect(emails).toHaveLength(1);
    const { body, init } = emails[0]!;
    expect(body.to).toEqual(["priya@example.com"]);
    expect(body.from).toBe("Webinar <webinar@example.in>");
    expect(String(body.html)).toContain(WA);
    expect(String(body.text)).toContain(WA);
    expect(String(body.subject)).not.toMatch(/[—–]/);
    expect((init.headers as Record<string, string>)["idempotency-key"]).toBe(`seat-confirmation/${ORDER_ID}`);
  });

  it("a second server instance (or a webhook retry) doesn't email again", async () => {
    await (await instance()).fulfil.fulfilPaidOrder(paidOrder() as never);
    await (await instance()).fulfil.fulfilPaidOrder(paidOrder() as never);
    expect(emails).toHaveLength(1);
  });

  it("the already-paid list lives in Firestore, under hashed ids only", async () => {
    await (await instance()).fulfil.fulfilPaidOrder(paidOrder() as never);
    const { buyers } = await instance(); // new instance: nothing cached in memory
    expect(await buyers.findPaidOrder({ email: "PRIYA@example.com" })).toBe(ORDER_ID);
    expect(await buyers.findPaidOrder({ phone: "+91 98765 43210" })).toBe(ORDER_ID);
    expect(await buyers.findPaidOrder({ email: "new@example.com", phone: "9000000001" })).toBeNull();

    const ids = [...docs.keys()].filter((k) => k.startsWith("/paid_contacts/"));
    expect(ids).toHaveLength(2);
    for (const id of ids) {
      expect(id).toMatch(/^\/paid_contacts\/sandbox_20261004_(email|phone)_[0-9a-f]{40}$/);
      expect(id).not.toContain("priya");
      expect(id).not.toContain("9876543210");
    }
  });

  it("a second paid order for the same person is marked duplicate_of the first", async () => {
    await (await instance()).fulfil.fulfilPaidOrder(paidOrder() as never);
    const second = paidOrder({ order_id: OTHER_ORDER, customer_details: { customer_name: "Priya", customer_email: "other@example.com", customer_phone: "9876543210" } });
    await expect((await instance()).fulfil.fulfilPaidOrder(second as never)).resolves.toEqual({ duplicateOf: ORDER_ID });
    expect(docs.get(`/registrations/${OTHER_ORDER}`)!.duplicate_of).toEqual({ stringValue: ORDER_ID });
  });

  it("signs the Google token request with the service-account key (RS256), and reuses the token", async () => {
    const { fulfil } = await instance();
    await fulfil.fulfilPaidOrder(paidOrder() as never);
    expect(tokenCalls).toHaveLength(1);
    const assertion = new URLSearchParams(tokenCalls[0]!).get("assertion")!;
    const [h, p, s] = assertion.split(".");
    expect(JSON.parse(Buffer.from(h!, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(p!, "base64url").toString())).toMatchObject({
      iss: "webinar-server@demo-webinar.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
    });
    expect(createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey, Buffer.from(s!, "base64url"))).toBe(true);
  });

  it("Firestore down: the buyer still gets the email, and the step is reported as failed (webhook retries)", async () => {
    firestoreDown = true;
    const { fulfil } = await instance();
    await expect(fulfil.fulfilPaidOrder(paidOrder() as never)).rejects.toThrow(/Firestore/);
    expect(emails).toHaveLength(1);
    // Once Firestore is back, the retry saves the row as already emailed and doesn't email again.
    firestoreDown = false;
    await expect(fulfil.fulfilPaidOrder(paidOrder() as never)).resolves.toEqual({});
    expect(emails).toHaveLength(1);
    expect(row().email_status).toEqual({ stringValue: "sent" });
  });

  it("on Firebase App Hosting it needs no Firebase settings: project from FIREBASE_CONFIG, built-in account", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
    vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "demo-webinar", storageBucket: "demo-webinar.appspot.com" }));
    vi.stubEnv("K_SERVICE", "webinar-backend");
    const { fulfil } = await instance();
    await fulfil.fulfilPaidOrder(paidOrder() as never);
    expect(tokenCalls).toEqual(["metadata"]);
    expect(row().order_id).toEqual({ stringValue: ORDER_ID });
  });

  it("the email escapes the buyer's name", async () => {
    const { confirmationEmail } = await import("@/lib/email");
    const mail = confirmationEmail({ firstName: "<b>Priya</b>", orderId: ORDER_ID, whatsappUrl: WA, siteUrl: SITE });
    expect(mail.html).not.toContain("<b>Priya</b>");
    expect(mail.html).toContain("&lt;b&gt;Priya&lt;/b&gt;");
  });
});

describe("webhook with Firestore + Resend", () => {
  function paidWebhook() {
    const raw = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: ORDER_ID }, payment: { cf_payment_id: String(Math.random()) } } });
    const ts = String(Date.now());
    return new NextRequest(`${SITE}/api/webhooks/cashfree`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-webhook-timestamp": ts, "x-webhook-signature": sign(raw, ts) },
      body: raw,
    });
  }

  it("email down → 503 so Cashfree retries; the retry sends it and answers 200", async () => {
    // Cashfree's Get Order answers PAID; everything else goes to the fakes.
    const fakes = fakeApis();
    mockFetch(async (url, init) => (url.includes("cashfree.com") ? jsonResponse(paidOrder()) : fakes(url, init)));

    resendStatus = 500;
    const { webhook } = await instance();
    expect((await webhook.POST(paidWebhook())).status).toBe(503);
    expect(row().email_status).toEqual({ stringValue: "failed" });

    resendStatus = 200;
    expect((await webhook.POST(paidWebhook())).status).toBe(200);
    expect(row().email_status).toEqual({ stringValue: "sent" });
    expect(emails.filter((e) => e.body.to)).toHaveLength(2); // one failed attempt, one delivered
  });
});
