import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** Dev only: lets a phone on the same Wi-Fi open http://<laptop-ip>:3000 (Next blocks unknown dev origins). */
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n!.address);

// Self-hosted: `npm run build` then `npm start` (next start) on any server with Node.js 20.9+. The pages are
// pre-built (served as files, no work per visit); only /api/* runs code (app/api → server/routes).
// Settings come from a `.env` file next to package.json (see .env.example); Next loads it automatically.

// Security headers for every page. A pre-built page can't carry a fresh nonce per visit, so inline scripts are
// allowed by 'unsafe-inline'; everything else is pinned: scripts only from this site and Razorpay (checkout.js
// also loads its risk check from cdn.razorpay.com), frames only from Razorpay, no plugins, no framing of this
// site. Meta's hosts only when a Pixel ID is set.
const pixel = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);
const https = (process.env.SITE_URL ?? "").startsWith("https://");
const RZP = "https://*.razorpay.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${RZP}${pixel ? " https://connect.facebook.net" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${RZP}${pixel ? " https://www.facebook.com" : ""}`,
  "font-src 'self' data:",
  "media-src 'self' blob:",
  `connect-src 'self' ${RZP}${pixel ? " https://www.facebook.com https://connect.facebook.net" : ""}`,
  `frame-src ${RZP}`,
  `form-action 'self' ${RZP}`,
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(https ? ["upgrade-insecure-requests"] : []), // would break plain-http local testing
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: lanHosts,
  images: {
    // No image work at request time: scripts/make-images.mjs writes WebP copies at these widths at build time,
    // and lib/image-loader.ts points next/image at them.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [640, 828, 1080, 1600],
    imageSizes: [128, 256, 384],
  },
  async headers() {
    return [
      {
        // Pages and files (the API sets its own, stricter headers in server/http.ts).
        source: "/((?!api/).*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com")',
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        ],
      },
      { source: "/_img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      { source: "/media/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      { source: "/(thank-you|already-paid)", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
  async redirects() {
    // The bold typography is the only design, served at "/". Old /bold links keep working.
    return [{ source: "/bold", destination: "/", permanent: true }];
  },
};

export default nextConfig;
