// Runs before `next build`, with the same .env files Next reads.
// 1. Fails the build if a secret-looking variable would be exposed to the browser: anything named
//    NEXT_PUBLIC_* is inlined into client JavaScript.
// 2. Fails the build with a clear message if SITE_URL isn't a full web address (Next would crash later with
//    "Invalid URL"); warns if it's missing (share previews would point to localhost).
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

const bad = Object.keys(process.env).filter(
  (k) => k.startsWith("NEXT_PUBLIC_") && /SECRET|TOKEN|PASSWORD|PRIVATE|CLIENT_ID|API_KEY|CAPI|UPSTASH|CASHFREE_CLIENT/i.test(k),
);
if (bad.length) {
  console.error(`Refusing to build: secret-looking public env vars: ${bad.join(", ")}`);
  process.exit(1);
}

const site = process.env.SITE_URL?.trim();
if (site) {
  let ok = false;
  try {
    ok = /^https?:$/.test(new URL(site).protocol);
  } catch {}
  if (!ok) {
    console.error(`Refusing to build: SITE_URL in .env must be a full address like https://your-domain.in (got "${site}").`);
    process.exit(1);
  }
} else {
  console.warn("Note: SITE_URL is not set in .env. Fine on your own computer; on the server, set it before building.");
}
console.log("public env check passed");
