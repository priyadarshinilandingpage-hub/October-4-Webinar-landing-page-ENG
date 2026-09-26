// Runs after `next build`: writes out/_headers, Cloudflare Pages' security headers for every page.
// (A static site can't set a fresh CSP nonce per visit, so inline scripts are allowed by 'unsafe-inline'. The page
// has no user-generated content, the payment runs inside Razorpay's own checkout, and every other source is
// pinned: scripts only from this site and Razorpay's checkout, frames only from Razorpay, no plugins, no framing.)
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const pixel = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);
const RZP = "https://*.razorpay.com";
const META_SCRIPT = pixel ? " https://connect.facebook.net" : "";
const META_CONNECT = pixel ? " https://www.facebook.com https://connect.facebook.net" : "";
const META_IMG = pixel ? " https://www.facebook.com" : "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${META_SCRIPT}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${RZP}${META_IMG}`,
  "font-src 'self' data:",
  "media-src 'self' blob:",
  `connect-src 'self' ${RZP}${META_CONNECT}`,
  `frame-src ${RZP}`,
  `form-action 'self' ${RZP}`,
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const headers = `/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com")
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  X-Permitted-Cross-Domain-Policies: none

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/_img/*
  Cache-Control: public, max-age=86400

/media/*
  Cache-Control: public, max-age=86400

/thank-you*
  X-Robots-Tag: noindex

/already-paid*
  X-Robots-Tag: noindex
`;

writeFileSync(join(process.cwd(), "out", "_headers"), headers);
console.log(`_headers written (Meta Pixel hosts ${pixel ? "allowed" : "not needed"})`);
