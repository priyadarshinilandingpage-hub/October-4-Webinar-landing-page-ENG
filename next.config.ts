import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** Dev only: lets a phone on the same Wi-Fi open http://<laptop-ip>:3000 (Next blocks unknown dev origins). */
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n!.address);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: lanHosts,
  // Page security headers (CSP with a per-request nonce, HSTS, frame-ancestors, ...) are set in proxy.ts.
  // API routes skip the proxy, so they get a fixed set here. They send no CORS headers: same-origin only.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
