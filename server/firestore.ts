import { base64url, signRs256 } from "./crypto";
import type { ServerEnv } from "./env";

// Minimal Firestore client over the REST API (no SDK). Docs: https://firebase.google.com/docs/firestore/reference/rest
// Auth: the service-account key (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) signs a short-lived Google token.
// These requests bypass Firestore security rules, so firestore.rules denies every browser read and write.

const SCOPE = "https://www.googleapis.com/auth/datastore";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export class FirestoreError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FirestoreError";
  }
}

export function firestoreEnabled(env: ServerEnv): boolean {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

/** Our document ids are hashes and order ids: plain URL-safe characters only, so nothing needs escaping. */
const ID_RE = /^[A-Za-z0-9_-]{1,200}$/;
function safeId(id: string): string {
  if (!ID_RE.test(id)) throw new FirestoreError("Firestore: invalid document id", 400);
  return id;
}

// One cached token per service account, shared by parallel callers.
const tokens = new Map<string, { value: string; expiresAt: number }>();
const pending = new Map<string, Promise<string>>();

function accessToken(env: ServerEnv, now = Date.now()): Promise<string> {
  const who = env.FIREBASE_CLIENT_EMAIL!;
  const t = tokens.get(who);
  if (t && t.expiresAt - 60_000 > now) return Promise.resolve(t.value);
  let p = pending.get(who);
  if (!p) {
    p = fetchToken(env, now).finally(() => pending.delete(who));
    pending.set(who, p);
  }
  return p;
}

async function fetchToken(env: ServerEnv, now: number): Promise<string> {
  const iat = Math.floor(now / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(
    JSON.stringify({ iss: env.FIREBASE_CLIENT_EMAIL, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }),
  )}`;
  const assertion = `${unsigned}.${await signRs256(env.FIREBASE_PRIVATE_KEY!, unsigned)}`;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString(),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new FirestoreError(`Firestore auth failed: ${res.status}`, res.status);
  const body = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new FirestoreError("Firestore auth failed: no token", 500);
  tokens.set(env.FIREBASE_CLIENT_EMAIL!, { value: body.access_token, expiresAt: now + (body.expires_in ?? 3600) * 1000 });
  return body.access_token;
}

const root = (env: ServerEnv) => `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const docName = (env: ServerEnv, collection: string, id: string) => `${root(env)}/${collection}/${safeId(id)}`;
const url = (path: string) => `https://firestore.googleapis.com/v1/${path}`;

async function call(env: ServerEnv, target: string, init: { method: "GET" | "POST" | "PATCH"; body?: unknown }): Promise<Response> {
  const res = await fetch(target, {
    method: init.method,
    headers: { authorization: `Bearer ${await accessToken(env)}`, ...(init.body ? { "content-type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  if (res.status === 401) tokens.delete(env.FIREBASE_CLIENT_EMAIL!); // expired or revoked: fetch a new one next time
  return res;
}

// ── Values ──────────────────────────────────────────────────────────────────────────────────────

export type FieldValue = string | number | boolean | Date | null;
type RawValue = Record<string, unknown>;
type RawDoc = { name?: string; fields?: Record<string, RawValue> };

function encode(v: FieldValue): RawValue {
  if (v === null) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  return { stringValue: v };
}

function decode(v: RawValue): FieldValue {
  if ("stringValue" in v) return String(v.stringValue);
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return Boolean(v.booleanValue);
  if ("timestampValue" in v) return new Date(String(v.timestampValue));
  return null;
}

const encodeAll = (fields: Record<string, FieldValue>) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, encode(v)]));
const decodeAll = (doc: RawDoc): Record<string, FieldValue> =>
  Object.fromEntries(Object.entries(doc.fields ?? {}).map(([k, v]) => [k, decode(v)]));

// ── Operations ──────────────────────────────────────────────────────────────────────────────────

/** Creates a document only if it doesn't exist yet (atomic). "exists" when it was already there. */
export async function createDoc(env: ServerEnv, collection: string, id: string, fields: Record<string, FieldValue>): Promise<"created" | "exists"> {
  const res = await call(env, url(`${root(env)}/${collection}?documentId=${safeId(id)}`), { method: "POST", body: { fields: encodeAll(fields) } });
  if (res.ok) return "created";
  if (res.status === 409) return "exists";
  throw new FirestoreError(`Firestore create ${collection} failed: ${res.status}`, res.status);
}

export async function getDoc(env: ServerEnv, collection: string, id: string): Promise<Record<string, FieldValue> | null> {
  const res = await call(env, url(docName(env, collection, id)), { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok) throw new FirestoreError(`Firestore get ${collection} failed: ${res.status}`, res.status);
  return decodeAll((await res.json()) as RawDoc);
}

/** Reads several documents of one collection. Missing ones are left out of the map. */
export async function getDocs(env: ServerEnv, collection: string, ids: string[]): Promise<Map<string, Record<string, FieldValue>>> {
  const out = new Map<string, Record<string, FieldValue>>();
  if (ids.length === 0) return out;
  const res = await call(env, url(`${root(env)}:batchGet`), { method: "POST", body: { documents: ids.map((id) => docName(env, collection, id)) } });
  if (!res.ok) throw new FirestoreError(`Firestore batchGet ${collection} failed: ${res.status}`, res.status);
  for (const item of (await res.json()) as { found?: RawDoc }[]) {
    const name = item.found?.name;
    if (name) out.set(name.slice(name.lastIndexOf("/") + 1), decodeAll(item.found!));
  }
  return out;
}

/** Updates the given fields of an existing document (other fields are kept). */
export async function updateDoc(env: ServerEnv, collection: string, id: string, fields: Record<string, FieldValue>): Promise<void> {
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const res = await call(env, `${url(docName(env, collection, id))}?${mask}&currentDocument.exists=true`, { method: "PATCH", body: { fields: encodeAll(fields) } });
  if (!res.ok) throw new FirestoreError(`Firestore update ${collection} failed: ${res.status}`, res.status);
}

/** Test hook: forget cached tokens. */
export function resetFirestoreForTests() {
  tokens.clear();
  pending.clear();
}
