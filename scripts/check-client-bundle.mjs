// Runs after `next build`. Scans the browser bundles (.next/static) for server-only secrets:
// the values of secret env vars (when set at build time) and code markers that only server code has.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SECRET_VARS = [
  "CASHFREE_CLIENT_SECRET",
  "CASHFREE_CLIENT_ID",
  "META_CAPI_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "FIREBASE_PRIVATE_KEY",
];
const needles = [
  "x-client-secret", // Cashfree auth header, only built in lib/cashfree.ts
  "CASHFREE_CLIENT_SECRET",
  "META_CAPI_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "FIREBASE_PRIVATE_KEY",
  "BEGIN PRIVATE KEY", // any PEM key
  "urn:ietf:params:oauth:grant-type:jwt-bearer", // Google token exchange, only in lib/firestore.ts
  ...SECRET_VARS.map((k) => process.env[k]).filter((v) => typeof v === "string" && v.length >= 8),
];

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(js|mjs|json|html|txt|map)$/.test(name)) yield p;
  }
}

const root = join(process.cwd(), ".next", "static");
let found = 0;
try {
  for (const file of files(root)) {
    const text = readFileSync(file, "utf8");
    for (const n of needles) {
      if (text.includes(n)) {
        found++;
        // Print the file, never the secret value itself.
        console.error(`Secret leak: ${file} contains ${SECRET_VARS.some((k) => process.env[k] === n) ? "a secret env value" : JSON.stringify(n)}`);
      }
    }
  }
} catch (err) {
  console.error(`client bundle check could not read ${root}: ${err.message}`);
  process.exit(1);
}
if (found) process.exit(1);
console.log("client bundle check passed");
