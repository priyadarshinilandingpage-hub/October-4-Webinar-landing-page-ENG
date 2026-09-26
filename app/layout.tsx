import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Backdrop } from "@/components/Backdrop";
import { MetaPixel } from "@/components/MetaPixel";
import { OFFER } from "@/lib/offer";
import "./globals.css";

// Self-hosted at build time by next/font: no runtime request to Google (CSP font-src 'self').
// Typed "ledger" face for labels, stamps, prices and counters (font-mono utility).
const ledger = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ledger",
  preload: false,
  display: "swap",
});

// The page typography (app/bold.css): heavy grotesk headlines, soft italic accents, clean body. Preloaded.
// Headlines + numerals: a heavy, characterful grotesk (opsz axis: the tight display cut at big sizes).
// latin-ext carries the ₹ glyph, so "₹99" is set in the same heavy face.
const boldDisplay = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-bold-display",
  display: "swap",
});
// Emphasised words + captions: soft, curly italic (SOFT/WONK axes) = the "floral" voice.
const boldAccent = Fraunces({
  subsets: ["latin"],
  style: "italic",
  axes: ["SOFT", "WONK"],
  variable: "--font-bold-accent",
  display: "swap",
});
// Body copy + labels.
const boldBody = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bold-body",
  display: "swap",
});

const META_DOMAIN_VERIFICATION = /^[a-z0-9]{10,64}$/.test(process.env.META_DOMAIN_VERIFICATION ?? "")
  ? process.env.META_DOMAIN_VERIFICATION
  : undefined;

export const metadata: Metadata = {
  // Absolute URLs for the share preview (og:image), fixed at build time: SITE_URL (set it in Cloudflare Pages for
  // the build too), else Cloudflare's own address for this deployment, else localhost for dev.
  metadataBase: new URL(process.env.SITE_URL || process.env.CF_PAGES_URL || "http://localhost:3000"),
  title: "Start Small, Invest Smart, Build Wealth · Live Webinar with Priyadharsini",
  description: `Live Tamil webinar on ${OFFER.dateLabel}: investment planning, capital management, market opportunities, loans & subsidies. Registration ₹${OFFER.priceInr}.`,
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "Start Small, Invest Smart, Build Wealth · Live Tamil Webinar",
    description:
      "Learn how Priyadharsini invested and built an indoor saffron farm, and how to grow your own money into a business and long-term wealth.",
    locale: "en_IN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Start small. Invest smart. Build wealth. Live Tamil webinar with Priyadharsini, Sun 4 Oct, 11:00 AM, ₹99" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  // Meta Business Manager domain verification (meta-tag method). Not a secret; set per deployment.
  ...(META_DOMAIN_VERIFICATION && { other: { "facebook-domain-verification": META_DOMAIN_VERIFICATION } }),
};

export const viewport: Viewport = {
  themeColor: "#fbf9fc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${ledger.variable} ${boldDisplay.variable} ${boldAccent.variable} ${boldBody.variable}`}
      // public/boot.js sets data-theme / data-variant on <html> before React starts.
      suppressHydrationWarning
    >
      <head>
        {/* Blocking on purpose (tiny, same origin, cached): picks the ad headline and saved theme before paint. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/boot.js" />
      </head>
      <body className="min-h-dvh bg-ivory font-sans text-ink antialiased">
        {/* Without JS, scroll-reveal wrappers must still be visible. (A <style> is allowed by style-src 'unsafe-inline'.) */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}"}</style>
        </noscript>
        <Backdrop />
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
