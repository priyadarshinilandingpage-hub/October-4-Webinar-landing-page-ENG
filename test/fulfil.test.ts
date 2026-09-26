import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findPaidOrder, resetBuyersForTests } from "@/server/buyers";
import { confirmationEmail } from "@/server/email";
import { readEnv, type ServerEnv } from "@/server/env";
import { resetFirestoreForTests } from "@/server/firestore";
import { fulfilPaidOrder, resetFulfilForTests } from "@/server/fulfil";
import { toPaidOrder } from "@/server/order";
import type { RazorpayOrder } from "@/server/razorpay";
import { jsonResponse, mockFetch, ORDER_ID, OTHER_ORDER, rzpOrder, SITE, testEnv } from "./helpers";

// The follow-up after a verified payment, against in-memory fakes of Firestore, Google's token endpoint and Resend.

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const WA = "https://chat.whatsapp.com/TestInviteCode123";

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
    if (url === "https://api.resend.com/emails") {
      emails.push({ init, body: JSON.parse(String(init.body)) });
      return resendStatus === 200 ? jsonResponse({ id: `email_${emails.length}` }) : jsonResponse({ name: "error" }, resendStatus);
    }
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

const env = (): ServerEnv =>
  readEnv(
    testEnv({
      FIREBASE_PROJECT_ID: "demo-webinar",
      FIREBASE_CLIENT_EMAIL: "webinar-server@demo-webinar.iam.gserviceaccount.com",
      FIREBASE_PRIVATE_KEY: PEM.replace(/\n/g, "\\n"), // as most dashboards store it
      RESEND_API_KEY: "re_test_1234567890abcdef",
      EMAIL_FROM: "Webinar <webinar@example.in>",
      WEBINAR_WHATSAPP_URL: WA,
    }),
  );
const paid = (over: Record<string, unknown> = {}) => toPaidOrder(rzpOrder(over) as unknown as RazorpayOrder);
const row = (id = ORDER_ID) => docs.get(`/registrations/${id}`)!;

beforeEach(() => {
  docs = new Map();
  emails = [];
  tokenCalls = [];
  resendStatus = 200;
  firestoreDown = false;
  resetBuyersForTests();
  resetFulfilForTests();
  resetFirestoreForTests();
  fakeApis();
});
afterEach(() => vi.unstubAllGlobals());

describe("fulfilPaidOrder", () => {
  it("adds one registrations row with readable columns and sends one email with the WhatsApp link", async () => {
    const order = paid({ notes: { name: "Priya Raman", email: "priya@example.com", phone: "9876543210", consent_marketing: "true", utm_source: "meta", utm_content: "creative_b" } });
    await expect(fulfilPaidOrder(env(), order)).resolves.toEqual({});
    expect(row()).toMatchObject({
      order_id: { stringValue: ORDER_ID },
      name: { stringValue: "Priya Raman" },
      email: { stringValue: "priya@example.com" },
      phone: { stringValue: "9876543210" },
      amount: { integerValue: "99" },
      currency: { stringValue: "INR" },
      status: { stringValue: "PAID" },
      mode: { stringValue: "test" },
      webinar_date: { stringValue: "2026-10-04" },
      marketing_consent: { booleanValue: true },
      utm_source: { stringValue: "meta" },
      utm_content: { stringValue: "creative_b" },
      utm_campaign: { nullValue: null },
      duplicate_of: { nullValue: null },
      email_status: { stringValue: "sent" },
    });
    expect(emails).toHaveLength(1);
    const { body, init } = emails[0]!;
    expect(body.to).toEqual(["priya@example.com"]);
    expect(String(body.html)).toContain(WA);
    expect(String(body.subject)).not.toMatch(/[—–]/);
    expect((init.headers as Record<string, string>)["idempotency-key"]).toBe(`seat-confirmation/${ORDER_ID}`);
  });

  it("a second call (another instance, a webhook retry) doesn't email again", async () => {
    await fulfilPaidOrder(env(), paid());
    resetFulfilForTests(); // like a fresh instance: only Firestore remembers
    await fulfilPaidOrder(env(), paid());
    expect(emails).toHaveLength(1);
  });

  it("the already-paid list is in Firestore, under hashed ids only", async () => {
    await fulfilPaidOrder(env(), paid());
    resetBuyersForTests();
    expect(await findPaidOrder(env(), { email: "PRIYA@example.com" })).toBe(ORDER_ID);
    expect(await findPaidOrder(env(), { phone: "+91 98765 43210" })).toBe(ORDER_ID);
    expect(await findPaidOrder(env(), { email: "new@example.com", phone: "9000000001" })).toBeNull();
    const ids = [...docs.keys()].filter((k) => k.startsWith("/paid_contacts/"));
    expect(ids).toHaveLength(2);
    for (const id of ids) {
      expect(id).toMatch(/^\/paid_contacts\/test_20261004_(email|phone)_[0-9a-f]{40}$/);
      expect(id).not.toContain("priya");
      expect(id).not.toContain("9876543210");
    }
  });

  it("a second paid order for the same person is marked duplicate_of the first", async () => {
    await fulfilPaidOrder(env(), paid());
    const second = paid({ id: OTHER_ORDER, notes: { name: "Priya", email: "other@example.com", phone: "9876543210" } });
    await expect(fulfilPaidOrder(env(), second)).resolves.toEqual({ duplicateOf: ORDER_ID });
    expect(row(OTHER_ORDER).duplicate_of).toEqual({ stringValue: ORDER_ID });
  });

  it("Firestore down: the buyer still gets the email, the failure is reported, the retry completes the row", async () => {
    firestoreDown = true;
    await expect(fulfilPaidOrder(env(), paid())).rejects.toThrow(/Firestore/);
    expect(emails).toHaveLength(1);
    firestoreDown = false;
    await expect(fulfilPaidOrder(env(), paid())).resolves.toEqual({});
    expect(emails).toHaveLength(1);
    expect(row().email_status).toEqual({ stringValue: "sent" });
  });

  it("signs the Google token request with the service-account key (RS256) and reuses the token", async () => {
    await fulfilPaidOrder(env(), paid());
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

  it("the email escapes the buyer's name", () => {
    const mail = confirmationEmail({ firstName: "<b>Priya</b>", orderId: ORDER_ID, whatsappUrl: WA, siteUrl: SITE });
    expect(mail.html).not.toContain("<b>Priya</b>");
    expect(mail.html).toContain("&lt;b&gt;Priya&lt;/b&gt;");
  });
});
