// Web Crypto helpers (available on Cloudflare Workers and in Node 20+).

const enc = new TextEncoder();

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return s;
}

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

export async function hmacSha256Hex(secret: string, message: string | Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const data = typeof message === "string" ? enc.encode(message) : message;
  return toHex(await crypto.subtle.sign("HMAC", key, data as BufferSource));
}

/** Constant-time comparison of two hex strings of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length || !/^[0-9a-f]*$/i.test(a)) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function base64url(input: string | ArrayBuffer | Uint8Array): string {
  const bytes = typeof input === "string" ? enc.encode(input) : input instanceof Uint8Array ? input : new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Signs `data` with an RSA private key given as PEM (PKCS#8), RS256. For the Google service-account token. */
export async function signRs256(pem: string, data: string): Promise<string> {
  const b64 = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  return base64url(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(data)));
}

export function randomHex(bytes = 16): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}
