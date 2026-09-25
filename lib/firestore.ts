import "server-only";
import { createSign } from "node:crypto";
import { env } from "./env";

// Minimal Firestore client over the REST API (no SDK dependency), server only.
// Docs: https://firebase.google.com/docs/firestore/reference/rest
// Auth: a service-account key (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) signs a short-lived token;
// on Google Cloud (Firebase App Hosting) the built-in service account is used instead.
// These requests bypass Firestore security rules, so the rules can (and should) deny all browser access.

const SCOPE = "https://www.googleapis.com/auth/datastore";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const METADATA_TOKEN_URL = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

export class FirestoreError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FirestoreError";
  }
}

/**
 * FIREBASE_PROJECT_ID, or, on Firebase App Hosting, the project the site runs in: App Hosting sets
 * FIREBASE_CONFIG (JSON with projectId) automatically, so nothing needs configuring there.
 */
function configuredProjectId(): string | undefined {
  const explicit = env().FIREBASE_PROJECT_ID;
  if (explicit) return explicit;
  const raw = process.env.FIREBASE_CONFIG?.trim();
  if (!raw?.startsWith("{")) return undefined;
  try {
    const id = (JSON.parse(raw) as { projectId?: unknown }).projectId;
    return typeof id === "string" && /^[a-z][a-z0-9-]{4,29}$/.test(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

function projectId(): string {
  const id = configuredProjectId();
  if (!id) throw new FirestoreError("Firestore is not configured", 500);
  return id;
}

/** Our document ids are hashes and order ids: plain URL-safe characters only, so nothing needs escaping. */
const ID_RE = /^[A-Za-z0-9_-]{1,200}$/;
function safeId(id: string): string {
  if (!ID_RE.test(id)) throw new FirestoreError("Firestore: invalid document id", 400);
  return id;
}

/** True when Firestore can be used: a project id plus a key, or a Google Cloud runtime. */
export function firestoreEnabled(): boolean {
  const e = env();
  return Boolean(configuredProjectId() && ((e.FIREBASE_CLIENT_EMAIL && e.FIREBASE_PRIVATE_KEY) || process.env.K_SERVICE));
}

let token: { value: string; expiresAt: number } | undefined;
let pending: Promise<string> | undefined;

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

/** A cached token; parallel callers share one refresh. */
function accessToken(now = Date.now()): Promise<string> {
  if (token && token.expiresAt - 60_000 > now) return Promise.resolve(token.value);
  pending ??= fetchToken(now).finally(() => (pending = undefined));
  return pending;
}

async function fetchToken(now: number): Promise<string> {
  const e = env();
  let res: Response;
  if (e.FIREBASE_CLIENT_EMAIL && e.FIREBASE_PRIVATE_KEY) {
    const iat = Math.floor(now / 1000);
    const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
      JSON.stringify({ iss: e.FIREBASE_CLIENT_EMAIL, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }),
    )}`;
    const signature = createSign("RSA-SHA256").update(unsigned).sign(e.FIREBASE_PRIVATE_KEY);
    res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${b64url(signature)}`,
      }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } else {
    res = await fetch(METADATA_TOKEN_URL, {
      headers: { "Metadata-Flavor": "Google" },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
  }
  if (!res.ok) throw new FirestoreError(`Firestore auth failed: ${res.status}`, res.status);
  const body = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new FirestoreError("Firestore auth failed: no token", 500);
  token = { value: body.access_token, expiresAt: now + (body.expires_in ?? 3600) * 1000 };
  return token.value;
}

const root = () => `projects/${projectId()}/databases/(default)/documents`;
const api = (path: string) => `https://firestore.googleapis.com/v1/${root()}${path}`;
const docName = (collection: string, id: string) => `${root()}/${collection}/${safeId(id)}`;

async function call(url: string, init: { method: "GET" | "POST" | "PATCH"; body?: unknown }): Promise<Response> {
  const res = await fetch(url, {
    method: init.method,
    headers: {
      authorization: `Bearer ${await accessToken()}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  if (res.status === 401) token = undefined; // expired or revoked: fetch a new one next time
  return res;
}

// ── Values ──────────────────────────────────────────────────────────────────────────────────────

export type FieldValue = string | number | boolean | Date | null;
type Encoded =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null };

function encode(v: FieldValue): Encoded {
  if (v === null) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  return { stringValue: v };
}

function decode(v: Record<string, unknown>): FieldValue {
  if ("stringValue" in v) return String(v.stringValue);
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return Boolean(v.booleanValue);
  if ("timestampValue" in v) return new Date(String(v.timestampValue));
  return null;
}

const encodeAll = (fields: Record<string, FieldValue>) =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, encode(v)]));

type RawDoc = { name?: string; fields?: Record<string, Record<string, unknown>> };

const decodeAll = (doc: RawDoc): Record<string, FieldValue> =>
  Object.fromEntries(Object.entries(doc.fields ?? {}).map(([k, v]) => [k, decode(v)]));

// ── Operations ──────────────────────────────────────────────────────────────────────────────────

/** Creates a document only if it doesn't exist yet (atomic). "exists" when it was already there. */
export async function createDoc(collection: string, id: string, fields: Record<string, FieldValue>): Promise<"created" | "exists"> {
  const res = await call(api(`/${collection}?documentId=${safeId(id)}`), { method: "POST", body: { fields: encodeAll(fields) } });
  if (res.ok) return "created";
  if (res.status === 409) return "exists";
  throw new FirestoreError(`Firestore create ${collection} failed: ${res.status}`, res.status);
}

export async function getDoc(collection: string, id: string): Promise<Record<string, FieldValue> | null> {
  const res = await call(`https://firestore.googleapis.com/v1/${docName(collection, id)}`, { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok) throw new FirestoreError(`Firestore get ${collection} failed: ${res.status}`, res.status);
  return decodeAll((await res.json()) as RawDoc);
}

/** Reads several documents of one collection. Missing ones are left out of the map. */
export async function getDocs(collection: string, ids: string[]): Promise<Map<string, Record<string, FieldValue>>> {
  const out = new Map<string, Record<string, FieldValue>>();
  if (ids.length === 0) return out;
  const res = await call(api(":batchGet"), { method: "POST", body: { documents: ids.map((id) => docName(collection, id)) } });
  if (!res.ok) throw new FirestoreError(`Firestore batchGet ${collection} failed: ${res.status}`, res.status);
  for (const item of (await res.json()) as { found?: RawDoc }[]) {
    const name = item.found?.name;
    if (!name) continue;
    out.set(name.slice(name.lastIndexOf("/") + 1), decodeAll(item.found!));
  }
  return out;
}

/** Updates the given fields of an existing document (other fields are kept). */
export async function updateDoc(collection: string, id: string, fields: Record<string, FieldValue>): Promise<void> {
  const mask = Object.keys(fields)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");
  const res = await call(`https://firestore.googleapis.com/v1/${docName(collection, id)}?${mask}&currentDocument.exists=true`, {
    method: "PATCH",
    body: { fields: encodeAll(fields) },
  });
  if (!res.ok) throw new FirestoreError(`Firestore update ${collection} failed: ${res.status}`, res.status);
}
