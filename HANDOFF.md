# HANDOFF: Priyadharsini · Saffron & Business webinar landing page

Last updated: 26 Sep 2026 (second chat: moved to Cloudflare Pages + Razorpay; already-paid block, Firebase, Resend, Meta Pixel). Read this whole file before doing anything. It is the memory of the previous chats.

---

## 0. Paste this into the new chat to continue

```
Continue the Priyadharsini saffron webinar landing page in C:\Users\shyam\Downloads\PRIYADARSINI-LANDING-PAGE.
First read HANDOFF.md in the project root fully, then README.md ("Architecture"), then run:
  npx tsc --noEmit ; npx vitest run ; npm run build
Fix anything that fails. Then check the "OPEN ITEMS" list in HANDOFF.md §6 and continue from the first
unchecked item. Follow the user's rules in HANDOFF.md §2 strictly (no em dashes, no "Nº", no "§", no "Fig",
no AI-looking filler text, dense layouts, smooth on low-end phones, never move my browser view: test in a
background tab). When I say "deploy", follow HANDOFF.md §8.
```

---

## 1. What this is
- A single-page, conversion-focused landing page selling a **₹99 live Tamil webinar** ("Start Small, Invest Smart, Build Wealth") by **Priyadharsini Subramaniam**, a startup strategist building an **indoor saffron (kunguma poo) farm in Tamil Nadu**. The date is **Sun 4 Oct 2026, 11:00 AM IST** (start time still to be confirmed by the client).
- Traffic comes from **Meta ads** (two ads in the brief). The page message-matches `utm_content=creative_b` (women angle); everything else gets creative A (investor angle).
- **Payments: Razorpay** (decided 26 Sep 2026; Cashfree code removed). **Hosting: Cloudflare Pages** free plan (decided 26 Sep 2026 because it's free with no card, allows selling, and never sleeps; Vercel Hobby forbids payments, Netlify free pauses when credits run out, Render free sleeps).
- **Repo:** github.com/priyadarshinilandingpage-hub/October-4-Webinar-landing-page (private). The user asked me to push; only push when they ask in that moment.

## 2. The user's rules and preferences (follow strictly)
1. **Only the bold typography design**, in **light and dark**, with a **sun/moon toggle** in the top bar (cookie `theme`). `/dark` opens dark; `/bold` 308-redirects to `/`.
2. **No em dashes (—) and no spaced en dashes (–)** in any visible text. **No "Nº", no "§", no "Fig."** labels. No AI-looking filler micro-text (fake serials, frame counts, "contact sheet" headers, "Plate · file" labels). Any text shown must carry real information.
3. **Not a luxury site.** Avoid big empty white space; layouts should be full and dense (like a strong direct-response sales page). A density-pass agent was running at handoff (see §6).
4. **Must never feel laggy** on any phone or PC. Animate transform/opacity only; no heavy blur or filters; videos play only when ≥35% visible (`LazyVideo`). Keep CPU-heavy local jobs sequential, and ffmpeg with `-threads 2`.
5. **Animations:** subtle and good-looking, never exaggerated. The user **rejected** the farm "darkroom develop" wipe and the "flying paper" animation; both are removed, so don't bring them back. Kept: the ticket "print and tear" reveal, the saffron thread (gentle rounded zig-zag drawn on scroll), and the video spotlight.
6. **Auto-scroll:** every visitor sees the hero for about 2.2 s, then a soft curtain fade, a jump, and a short eased glide to the ₹99 form `#join` (`components/AdAutoScroll.tsx`). Once per session. It cancels if the user scrolls or touches.
7. **Video spotlight** (About section, `components/VideoSpotlight.tsx`): auto-opens on **every page load** when the thumbnail is on screen, at about 70% of the screen, on a plum card. It **cannot be closed for the first 5 s** (the close button counts down 5-4-3-2-1), then stays open until closed. It has a sound toggle and a ₹99 CTA. Tapping the thumbnail opens it with sound.
8. **Review screenshots** are clickable and open a full-screen viewer (`components/ReviewLightbox.tsx`) with ✕, previous/next, swipe, arrow keys and a counter.
9. The **scrollbar is hidden**. Top-bar and label text is **larger on PC only**; mobile sizes stay as they are.
10. **Workflow preferences:**
    - The user likes parallel agents but hates laptop lag: max one or two heavy jobs at a time.
    - Never move or reload the user's preview tab. Use a separate background tab (`tabs_create`) for QA.
    - The user must approve spending. The Higgsfield budget was capped at 300 credits (189 spent).
    - Ask before downloading third-party files.
    - Use simple words when explaining things to the user.
11. **Ethics:**
    - Never AI-generate her face, farm, reviews or certificates as "proof". AI illustrations are captioned as illustrations.
    - Her portrait (`ChatGPT Image…png`) was supplied by the user as "her portrait". It is AI-edited; remind them she must approve it.
    - Review screenshots are redacted (member count "329" hidden, names blurred); client consent is still needed.

## 3. Stack and key files
- **Stack:** Next.js **16.3.6** with `output: "export"` (static files in `out/`), React 19.3, Tailwind 4, TypeScript 5.9, motion 13, zod 4, vitest 5, sharp (build-time image copies). No Node server: the payment steps are **Cloudflare Pages Functions** (`functions/api/*`, logic in `server/`, web-standard code only).
- **Fonts** (next/font, self-hosted): Bricolage Grotesque (display), Fraunces italic (accent), DM Sans (body), IBM Plex Mono (labels, not preloaded).
- **Page:** `app/page.tsx` → `components/LandingPage.tsx` (`/dark` passes `theme="dark"`). Both ads' headlines are in the page (`<ByAd>` in `components/ui.tsx`); `public/boot.js` (blocking, in `<head>`) sets `<html data-variant="b">` for `utm_content=creative_b` and applies `?theme=` / the `theme` cookie before paint. `components/ThemeToggle.tsx` flips `<html>` and the page wrapper.
- **Copy and media slots:** `components/content.ts`. Price and date: `lib/offer.ts` (single source of truth, ₹99 = `AMOUNT_PAISE` 9900; `SESSION_MINUTES`, `startTimeLabel()`, `calendarUrl()`). Business details: `lib/business.ts` (placeholders still there).
- **Sections:** `components/sections/*.tsx` (Hero, ProofMarquee, FarmBento, Problem, Modules, Journey, ValueStack, JoinSection, Reviews, Fit, About, Faq, Ticket, PsFooter), with helpers in `Fx.tsx` (data-fx idle/armed/in reveal states) and `fxStyle.ts`.
- **Styles:** `app/globals.css` (tokens, dark theme, appended blocks incl. the `.v-a/.v-b` ad switch), `app/sections.css`, `app/bold.css`, `app/overlays.css`.
- **Images:** `scripts/make-images.mjs` (prebuild) writes `public/_img/<w>/<path>.webp` at 128/256/384/640/828/1080/1600 (gitignored, rebuilt on deploy); `lib/image-loader.ts` is the next/image loader. `components/Media.tsx`, `components/LazyVideo.tsx` unchanged.
- **Payment flow:** `components/CheckoutForm.tsx` → `POST /api/orders` (`server/routes/orders.ts`: validation, already-paid check, fixed-price Razorpay order with the buyer in `notes`) → Razorpay checkout.js in **redirect mode** (`callback_url`) → `/api/razorpay/callback` (signature check, follow-up in `waitUntil`) → `/thank-you` (`app/thank-you/ThankYou.tsx` polls `GET /api/verify`; WhatsApp link only when PAID) + `POST /api/webhooks/razorpay` (signed; re-reads the order).
- **After a payment:** `server/fulfil.ts`: `server/buyers.ts` (already-paid list, Firestore `paid_contacts`, hashed ids; email OR phone, never name alone), Firestore `registrations` row (`server/firestore.ts`, REST + service-account JWT via Web Crypto), Resend email (`server/email.ts`). Steps independent; failures → webhook 503 → Razorpay retries. `firestore.rules` denies browser access.
- **Meta:** `components/MetaPixel.tsx` (PageView, InitiateCheckout, Purchase with eventID = Razorpay order id) and `server/meta-capi.ts` (Purchase for every buyer). The user chose **"track everyone, no asking"** (26 Sep 2026); the privacy page says so.
- **Security (don't weaken):** price fixed on the server; "paid" only from Razorpay's API (status paid, amount 9900, INR); checkout and webhook HMACs with constant-time compares; redirects only from `SITE_URL`; same-origin check on `/api/orders`; rate limits (`server/ratelimit.ts`, memory or Upstash REST); `out/_headers` from `scripts/write-headers.mjs` (CSP with `'unsafe-inline'` scripts because a static page can't use a per-request nonce; everything else pinned: Razorpay hosts, no framing, no plugins); `public/_routes.json` limits Functions to `/api/*`; `scripts/check-client-bundle.mjs` scans `out/` for secrets. Tests in `test/` (69 passing, 26 Sep 2026).

## 4. Media (all in `public/media/…`)
- **Hero:**
  - `hero/hero-portrait.jpg`: the user's supplied portrait, the main hero image and the About ID photo.
  - `hero/hero-loop-small.mp4`: the "Indoor saffron grow room" inset print.
  - `hero/hero-loop.mp4`: full size.
- **Farm:** `farm-setup-wide.mp4`, `harvest-stigma.mp4` (captioned "Sorting saffron threads", not harvest), `saffron-jar.jpg`, `corms-trays.jpg` (corms in hand).
- **Proof:** `proof/expo-madurai-stall.jpg` (two women visible, so consent is needed).
- **Journey:** `journey/day-02|15|58.mp4`, with captions set to the real dates 27 Jun / 6 Jul / 14 Aug.
- **Reviews:** `reviews/review-01…05.png` (redacted WhatsApp screenshots).
- **Creative:** `creatives/general.mp4` (+ jpg). This is the general authority ad ("WEBINAR 3"), used in the spotlight. Only this creative is used, not the business or women ads.
- **AI illustrations** in `ai/`:
  - `ai-crocus-bloom-light|dark.mp4` (farm tile, captioned "The crop: Crocus sativus (illustration)");
  - `ai-module-01…06-light|dark.mp4` (+ jpg posters) on the module cards;
  - `ai-problem-ledger.png` (Problem banner).
- **Other:**
  - `instagram/profile.jpg` (150 px avatar on the 39.4K tag).
  - Share image: `public/og.jpg` (the user's own design with her portrait), wired in `app/layout.tsx` metadata (`metadataBase` from `SITE_URL`).
- **Sources and docs** in `assets-inbox/`:
  - catalogues: `_catalog/footage.md`, `manifest.json`, `creatives.md`, `reviews.md`;
  - AI prompts: `AI-IMAGE-PROMPTS.md`, `AI-VIDEO-PROMPTS.md`; `AI-IMAGES.md` and `AI-PROMPTS-GAPS.md` are outdated;
  - generated images: `Saffron-Business-Images/`;
  - Seedance start frames and raw clips: `ai/video/`.
- **Raw Drive zips** (about 26 GB) are still in `assets-inbox/`, untouched. Extracted copies were deleted to free disk space (the disk was 96% full). Re-extract only what's needed, and outside the project if possible.
- **Higgsfield:** 14 Seedance 2.0 videos and 14 uploaded start frames are still in the user's Higgsfield library. The connector has **no delete tool**; remind the user to delete them manually. Job IDs are in `assets-inbox/ai/video/jobs.json`.

## 5. How to run and preview
- **Dev:** `.claude/launch.json` "web" runs `npm run dev -- -H 0.0.0.0` on port 3000 (pages only; `/api` Functions don't run in next dev).
- **Built site:** `npm run build` then `npm run preview` (launch config "preview", port 3300) serves `out/` like Cloudflare (pretty URLs, 404.html). `/api/*` answers 404 there; the Functions are covered by `npx vitest run`.
- **On the user's phone (same Wi-Fi):** `http://192.168.1.4:3000/` and `/dark`. The IP can change; check it with `ipconfig`.
- **QA:** use a background browser tab (`tabs_create`, then `navigate`, then `resize_window` on that tab). The pane is often hidden, so screenshots can time out and videos pause; rely on DOM measurements.
- **Useful test URLs:** `/?utm_content=creative_b&fbclid=x` (ad B plus auto-scroll); `/?theme=dark`; to bypass auto-scroll, `sessionStorage.setItem('as-join','1')`.
- **Razorpay test payments** (Test Mode keys): UPI `success@razorpay` / `failure@razorpay`; card 4111 1111 1111 1111.
- **Offline review copy:** a single-file HTML (`C:\Users\shyam\Downloads\Priyadharsini-Webinar-Preview.html`, 18 MB) was made from the OLD Cashfree build for the user's reviewers; the builder lived in the session scratchpad (gone). Rebuild it only if asked.

## 6. OPEN ITEMS (continue from the first unchecked one)
- [x] Density pass, leftovers removal, hero bouquet, already-paid block, Firebase rows, Resend email, WhatsApp step, Meta Pixel + CAPI: all done 26 Sep 2026 (see git history).
- [x] **Moved to Cloudflare Pages + Razorpay (26 Sep 2026):** static export + Functions, both ad headlines + boot.js, WebP image copies, `_headers`/`_routes.json`/`_redirects`, Cashfree/Vercel/Render/App Hosting files removed. Verified with `npm run preview`: all pages build, ad B and dark work before paint, images load, 404 page, thank-you shows "Payment not completed" without an order.
- [ ] **Razorpay account ownership (IMPORTANT, raised 26 Sep 2026):** the user created the Razorpay account on **their own personal PAN** but the webinar is **Priyadharsini's**. Razorpay rejected a brand name like "Indoor Saffron Farming" (must match the PAN name or the site's domain). Collecting another person's sales in your own merchant account breaks Razorpay's terms (and RBI's 2025 payment-aggregator rules: the account holder must be the real seller). Recommended: **she opens the Razorpay account on her own PAN** (individual, no GST needed under ₹20 lakh), adds the user as a team member; or the user becomes the seller on paper (the user's name on the policy pages; the user pays her separately). The code doesn't change either way: only the keys and `lib/business.ts`.
- [ ] **Cloudflare deploy** (§8), then one Razorpay Test Mode payment end to end, then live keys.
- [ ] **Verify in a real, visible browser** after deploy: the video spotlight (FLIP open, 5 s lock, sound, Esc, re-opens on refresh, never during auto-scroll), the review lightbox (open, next/prev, swipe, close, focus return), journey pages (no flying animation), a throttled-mobile performance run (auto-scroll glide smooth).
- [ ] **Hero portrait:** the user will send a new one; replace `public/media/hero/hero-portrait.jpg` (same name) and rebuild. (`/_img/` copies regenerate automatically because the source is newer.)
- [ ] **Client inputs still missing** (`npm run check:placeholders`): business legal name, address, support email and phone, grievance officer, city, GSTIN or "Not registered" (`lib/business.ts`); confirm 11:00 AM and the session length (`lib/offer.ts`); the buyers-only WhatsApp group link (`WEBINAR_WHATSAPP_URL`).
- [ ] **Keys to create:** Razorpay (test, then live; webhook with secret; automatic capture), Firebase project (Spark) with Firestore `asia-south1` + rules + service-account key, Resend (verified domain), Meta Pixel ID + CAPI token (+ domain verification), a custom domain (e.g. oakpace.in: checked free 26 Sep 2026; "Oakpace" had no trademark in WIPO).
- [ ] **Not built:** WhatsApp *messages* to buyers (only the group link). Refunds for a `duplicate_of` order are manual in the Razorpay dashboard.

## 7. Known facts and decisions (don't re-ask)
- **Price ₹99** (the ads say ₹99). Language Tamil. Only the **general authority creative** is used on the page.
- **Verified facts about her** (only use these): 39.4K Instagram followers, 5+ years in agribusiness, EDII Ahmedabad and TNAU alumna, New Enterprise Creation specialisation, EDII-TN resource person, "Day X" build series on Instagram (@priyadharsini_subramaniam_), stall at United Agritech 2026 Madurai.
- **Refund policy:** the user said not to worry. Standard wording is filled in: no refund for no-shows; refund if cancelled or rescheduled; failed payments reversed in 5 to 7 working days.
- **Bonuses:** none shown. The `BONUSES` list in `content.ts` is deliberately empty until the client confirms.

## 8. Deploy guide (short; full steps in README.md)
1. **Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to Git → the repo, branch `main`. Framework preset **None**, build command `npm run build`, output directory `out`. `.node-version` pins Node 22. Functions in `functions/` are picked up automatically.
2. **Settings** (Settings → Variables and Secrets; see `.env.example`): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (Secret), `RAZORPAY_WEBHOOK_SECRET` (Secret), optional `RAZORPAY_BRAND_NAME`, `SITE_URL` (also as a build variable), `WEBINAR_WHATSAPP_URL`, `FIREBASE_*`, `RESEND_API_KEY`/`EMAIL_FROM`/`EMAIL_REPLY_TO`, optional Upstash, Meta; build variables `NEXT_PUBLIC_META_PIXEL_ID`, `META_DOMAIN_VERIFICATION`. Redeploy after changes.
3. **Custom domain:** the project → Custom domains. Then set `SITE_URL` to it and redeploy.
4. **Razorpay:** webhook `https://<domain>/api/webhooks/razorpay` (events order.paid + payment.captured, secret = `RAZORPAY_WEBHOOK_SECRET`); payment capture Automatic; website details = the domain.
5. **Firestore:** Native mode, `asia-south1`, publish `firestore.rules`, service-account key into the three `FIREBASE_*` settings.
6. **After deploying, check:** headers (`curl -I https://<domain>/`), `/api/health`, a Test Mode payment (row in `registrations`, email, `/already-paid` on a repeat), and that `/thank-you` shows "confirmed" only for a PAID order.
7. **Share preview:** test the link in WhatsApp or the Facebook Sharing Debugger (og:image uses `SITE_URL` from the build).
