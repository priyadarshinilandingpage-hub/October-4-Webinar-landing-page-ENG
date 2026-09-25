// Runs before `next build`. Fails the build if a secret-looking variable would be exposed to the
// browser: anything named NEXT_PUBLIC_* is inlined into client JavaScript.
const bad = Object.keys(process.env).filter(
  (k) => k.startsWith("NEXT_PUBLIC_") && /SECRET|TOKEN|PASSWORD|PRIVATE|CLIENT_ID|API_KEY|CAPI|UPSTASH|CASHFREE_CLIENT/i.test(k),
);
if (bad.length) {
  console.error(`Refusing to build: secret-looking public env vars: ${bad.join(", ")}`);
  process.exit(1);
}
console.log("public env check passed");
