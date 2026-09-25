import { defaults, nosecone, type Options } from "@nosecone/next";
import { NextResponse, type NextRequest } from "next/server";

// Security headers for every page. Baseline from Nosecone (arcjet), opened up only where the official
// Cashfree v3 checkout needs it (see the CSP list in node_modules/@cashfreepayments/cashfree-js/README.md).
//
// How the checkout stays working under a strict CSP:
// - Next.js puts this request's nonce on its own <script> tags (it reads it from the CSP request header below).
// - 'strict-dynamic' lets those trusted scripts load more scripts, so the npm loader
//   (@cashfreepayments/cashfree-js) can inject https://sdk.cashfree.com/js/v3/cashfree.js.
// - checkout({ redirectTarget: "_self" }) submits a POST form to {api|sandbox}.cashfree.com/pg/view/sessions/checkout
//   → form-action. The SDK also uses hidden iframes and fetches on Cashfree hosts → frame-src / connect-src.
// - The SDK injects inline <style> and style="" attributes → style-src 'unsafe-inline' (no nonce there,
//   because a nonce would make browsers ignore 'unsafe-inline').

const isDev = process.env.NODE_ENV === "development";
const metaPixel = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);

// Hosts the SDK uses today: sdk., api., sandbox., payments., payments-test.cashfree.com. A subdomain wildcard
// is used because browsers also apply form-action to redirects after the checkout POST, and a new Cashfree
// subdomain in that chain would otherwise break payments.
const CASHFREE_HOSTS = ["https://*.cashfree.com"] as const;

// Meta Pixel endpoints, allowed only when a Pixel ID is configured (the frontend loads it after consent).
const META_SCRIPT = metaPixel ? (["https://connect.facebook.net"] as const) : [];
const META_CONNECT = metaPixel ? (["https://www.facebook.com", "https://connect.facebook.net"] as const) : [];
const META_IMG = metaPixel ? (["https://www.facebook.com"] as const) : [];

function securityHeaders(nonce: string, local: boolean): Headers {
  const options: Options = {
    ...defaults,
    contentSecurityPolicy: {
      directives: {
        ...defaults.contentSecurityPolicy.directives,
        defaultSrc: ["'self'"],
        // Hosts are a fallback for old browsers; modern ones use nonce + 'strict-dynamic' and ignore them.
        scriptSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          "'strict-dynamic'",
          "https://sdk.cashfree.com",
          ...META_SCRIPT,
          ...(isDev ? (["'unsafe-eval'"] as const) : []),
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://sdk.cashfree.com"],
        imgSrc: ["'self'", "blob:", "data:", "https://*.cashfree.com", ...META_IMG],
        fontSrc: ["'self'", "data:"],
        mediaSrc: ["'self'", "blob:"],
        connectSrc: ["'self'", ...CASHFREE_HOSTS, ...META_CONNECT],
        frameSrc: [...CASHFREE_HOSTS],
        childSrc: [...CASHFREE_HOSTS],
        formAction: ["'self'", ...CASHFREE_HOSTS],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        objectSrc: ["'none'"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        // Would break `next start` on http://localhost; always on for real (https) deployments.
        upgradeInsecureRequests: !isDev && !local,
      },
    },
    // Third-party checkout frames don't send CORP headers, so COEP must stay off.
    crossOriginEmbedderPolicy: false,
    // Lets UPI / 3-D Secure popups opened by the checkout talk back to this page.
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    // Other sites get our origin only, never paths or ?order_id=. (Cashfree's domain check still sees the origin.)
    referrerPolicy: { policy: ["strict-origin-when-cross-origin"] },
    strictTransportSecurity: { maxAge: 63_072_000, includeSubDomains: true, preload: false },
    xFrameOptions: { action: "deny" },
  };
  const headers = nosecone(options);
  headers.set(
    "Permissions-Policy",
    'camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=(), payment=(self "https://sdk.cashfree.com" "https://api.cashfree.com" "https://sandbox.cashfree.com" "https://payments.cashfree.com" "https://payments-test.cashfree.com")',
  );
  return headers;
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const host = request.nextUrl.hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  const headers = securityHeaders(nonce, local);

  // Next.js reads the nonce from the request's CSP header and applies it to its own scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", headers.get("Content-Security-Policy") ?? "");

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only. API routes set their own headers (next.config.ts) and are skipped here so the proxy
      // never buffers their request bodies. Static files and prefetches don't need a nonce.
      source: "/((?!api/|_next/static|_next/image|favicon.ico|media/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
