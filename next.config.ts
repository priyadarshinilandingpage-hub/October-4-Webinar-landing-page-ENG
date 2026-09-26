import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** Dev only: lets a phone on the same Wi-Fi open http://<laptop-ip>:3000 (Next blocks unknown dev origins). */
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n!.address);

// Cloudflare Pages: `next build` writes plain files to out/ (served free, unlimited, never asleep).
// The payment steps are Cloudflare Pages Functions in functions/ (see README "Architecture").
// Security headers are written to out/_headers by scripts/write-headers.mjs; redirects live in public/_redirects.
const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: lanHosts,
  images: {
    // No image server on a static host: scripts/make-images.mjs writes WebP copies at these widths at build time,
    // and lib/image-loader.ts points next/image at them.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [640, 828, 1080, 1600],
    imageSizes: [128, 256, 384],
  },
};

export default nextConfig;
