# HANDOFF: Priyadharsini · Saffron & Business webinar landing page

Last updated: 27 Sep 2026 (second chat: Razorpay on her own account, self-hosted Node server, new hero photo; no confirmation email (27 Sep: the user wants only the WhatsApp link after payment); earlier: already-paid block, Firebase, Meta Pixel). Read this whole file before doing anything. It is the memory of the previous chats.

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
- **Payments: Razorpay, on Priyadharsini's OWN account** (27 Sep 2026: she has Razorpay; her husband puts the keys in `.env`). Cashfree code removed.
- **Hosting: their own server** (27 Sep 2026: "they have a server", "the folder way", not Cloudflare). `npm ci && npm run build && npm start` with a `.env` file; pm2 + nginx/HTTPS in README. The Cloudflare Pages adapter (`functions/`) is kept but unused.
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
    - The hero portrait is now a real photo sent by the user on 27 Sep 2026 (the earlier AI-edited one is gone).
    - Review screenshots are redacted (member count "329" hidden, names blurred); client consent is still needed.

## 3. Stack and key files
- **Stack:** Next.js **16.3.6** (`next start`; every page is pre-built static, only `app/api/*` is dynamic), React 19.3, Tailwind 4, TypeScript 5.9, motion 13, zod 4, vitest 5, sharp (build-time image copies). The API route files call `server/routes/*` through `server/next-adapter.ts` (settings from `process.env`/`.env`, background work via `after()`). Security headers and the `/bold` redirect are in `next.config.ts`.
- **Fonts** (next/font, self-hosted): Bricolage Grotesque (display), Fraunces italic (accent), DM Sans (body), IBM Plex Mono (labels, not preloaded).
- **Page:** `app/page.tsx` → `components/LandingPage.tsx` (`/dark` passes `theme="dark"`). Both ads' headlines are in the page (`<ByAd>` in `components/ui.tsx`); `public/boot.js` (blocking, in `<head>`) sets `<html data-variant="b">` for `utm_content=creative_b` and applies `?theme=` / the `theme` cookie before paint. `components/ThemeToggle.tsx` flips `<html>` and the page wrapper.
- **Copy and media slots:** `components/content.ts`. Price and date: `lib/offer.ts` (single source of truth, ₹99 = `AMOUNT_PAISE` 9900; `SESSION_MINUTES`, `startTimeLabel()`, `calendarUrl()`). Business details: `lib/business.ts` (placeholders still there).
- **Sections:** `components/sections/*.tsx` (Hero, ProofMarquee, FarmBento, Problem, Modules, Journey, ValueStack, JoinSection, Reviews, Fit, About, Faq, Ticket, PsFooter), with helpers in `Fx.tsx` (data-fx idle/armed/in reveal states) and `fxStyle.ts`.
- **Styles:** `app/globals.css` (tokens, dark theme, appended blocks incl. the `.v-a/.v-b` ad switch), `app/sections.css`, `app/bold.css`, `app/overlays.css`.
- **Images:** `scripts/make-images.mjs` (prebuild) writes `public/_img/<w>/<path>.webp` at 128/256/384/640/828/1080/1600 (gitignored, rebuilt on deploy); `lib/image-loader.ts` is the next/image loader. `components/Media.tsx`, `components/LazyVideo.tsx` unchanged.
- **Payment flow:** `components/CheckoutForm.tsx` → `POST /api/orders` (`server/routes/orders.ts`: validation, already-paid check, fixed-price Razorpay order with the buyer in `notes`) → Razorpay checkout.js in **redirect mode** (`callback_url`) → `/api/razorpay/callback` (signature check, follow-up in `waitUntil`) → `/thank-you` (`app/thank-you/ThankYou.tsx` polls `GET /api/verify`; WhatsApp link only when PAID) + `POST /api/webhooks/razorpay` (signed; re-reads the order).
- **After a payment:** the verified thank-you page shows the WhatsApp group button (`WEBINAR_WHATSAPP_URL`). **No email is sent** (user's call, 27 Sep 2026; Resend code removed). `server/fulfil.ts`: `server/buyers.ts` (already-paid list, Firestore `paid_contacts`, hashed ids; email OR phone, never name alone) + the Firestore `registrations` row (`server/firestore.ts`, REST + service-account JWT via Web Crypto). Steps independent; failures → webhook 503 → Razorpay retries. `firestore.rules` denies browser access.
- **Meta:** `components/MetaPixel.tsx` (PageView, InitiateCheckout, Purchase with eventID = Razorpay order id) and `server/meta-capi.ts` (Purchase for every buyer). The user chose **"track everyone, no asking"** (26 Sep 2026); the privacy page says so.
- **Security (don't weaken):** price fixed on the server; "paid" only from Razorpay's API (status paid, amount 9900, INR); checkout and webhook HMACs with constant-time compares; redirects only from `SITE_URL`; same-origin check on `/api/orders`; rate limits (`server/ratelimit.ts`, memory or Upstash REST); CSP etc. in `next.config.ts` headers (`'unsafe-inline'` scripts because pre-built pages can't use a per-request nonce; everything else pinned: Razorpay hosts, no framing, no plugins; `upgrade-insecure-requests` only when `SITE_URL` is https at build); `server/http.ts` `clientIp` reads cf-connecting-ip / x-real-ip / x-forwarded-for; `scripts/check-client-bundle.mjs` scans `.next/static` for secrets. Tests in `test/` (69 passing, 26 Sep 2026).

## 4. Media (all in `public/media/…`)
- **Hero:**
  - `hero/hero-portrait.jpg`: **replaced 27 Sep 2026** with the real photo the user sent (her in the yellow kurta on the black sofa, green wall, shelf and lamp), cropped to 1071×1339 (4:5, top trimmed). Only the hero uses it; About has `about/about-portrait.jpg`.
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
- **Dev:** `.claude/launch.json` "web" runs `npm run dev -- -H 0.0.0.0` on port 3000.
- **Production build locally:** `npm run build`, then launch config "prod" (`npm start -- -p 3100`). Without a `.env`, the payment endpoints answer 503 ("temporarily unavailable"); the logic is covered by `npx vitest run`.
- **On the user's phone (same Wi-Fi):** `http://192.168.1.4:3000/` and `/dark`. The IP can change; check it with `ipconfig`.
- **QA:** use a background browser tab (`tabs_create`, then `navigate`, then `resize_window` on that tab). The pane is often hidden, so screenshots can time out and videos pause; rely on DOM measurements.
- **Useful test URLs:** `/?utm_content=creative_b&fbclid=x` (ad B plus auto-scroll); `/?theme=dark`; to bypass auto-scroll, `sessionStorage.setItem('as-join','1')`.
- **Razorpay test payments** (Test Mode keys): UPI `success@razorpay` / `failure@razorpay`; card 4111 1111 1111 1111.
- **Offline review copy:** a single-file HTML (`C:\Users\shyam\Downloads\Priyadharsini-Webinar-Preview.html`, 18 MB) was made from the OLD Cashfree build for the user's reviewers. Rebuild it only if asked.

## 6. OPEN ITEMS (continue from the first unchecked one)
- [x] Density pass, leftovers removal, hero bouquet, already-paid block, Firebase rows, WhatsApp step, Meta Pixel + CAPI, Razorpay integration: done 26 Sep 2026 (see git history).
- [x] **Self-hosted Node version (27 Sep 2026):** pre-built pages + `app/api/*` route files for verify, callback, webhook and health; headers and `/bold` redirect in `next.config.ts`; Cloudflare-only files removed (`functions/` kept, unused). Verified with `npm start`: pages, new hero photo (phone and desktop), CSP/X-Frame-Options headers, `/bold` redirect, `/api/health`.
- [x] **Hero photo replaced** with the real photo the user sent (27 Sep 2026).
- [x] **Razorpay ownership resolved:** Priyadharsini has her own Razorpay account; her husband adds the keys.
- [x] **`app/api/orders/route.ts` added (27 Sep 2026)** with the user's go-ahead.
- [ ] **Server deploy** (§8), then one Razorpay Test Mode payment end to end, then live keys.
- [x] **WhatsApp group link received (27 Sep 2026)** in chat: it goes ONLY in the server's `.env` as `WEBINAR_WHATSAPP_URL` (never in git).
- [ ] **Verify in a real, visible browser** after deploy: the video spotlight (FLIP open, 5 s lock, sound, Esc, re-opens on refresh, never during auto-scroll), the review lightbox (open, next/prev, swipe, close, focus return), journey pages (no flying animation), a throttled-mobile performance run (auto-scroll glide smooth).
- [ ] **Client inputs still missing** (`npm run check:placeholders`): business legal name, address, support email and phone, grievance officer, city, GSTIN or "Not registered" (`lib/business.ts`, must match her Razorpay account); confirm 11:00 AM and the session length (`lib/offer.ts`). The user said the privacy policy is their concern.
- [ ] **Keys to create:** Razorpay (test, then live; webhook with secret; automatic capture), Firebase project (Spark) with Firestore `asia-south1` + rules + service-account key, Meta Pixel ID + CAPI token (+ domain verification), the domain + HTTPS on their server.
- [ ] **Not built:** WhatsApp *messages* to buyers (only the group link). Refunds for a `duplicate_of` order are manual in the Razorpay dashboard.
## 7. Known facts and decisions (don't re-ask)
- **Price ₹99** (the ads say ₹99). Language Tamil. Only the **general authority creative** is used on the page.
- **Verified facts about her** (only use these): 39.4K Instagram followers, 5+ years in agribusiness, EDII Ahmedabad and TNAU alumna, New Enterprise Creation specialisation, EDII-TN resource person, "Day X" build series on Instagram (@priyadharsini_subramaniam_), stall at United Agritech 2026 Madurai.
- **Refund policy:** the user said not to worry. Standard wording is filled in: no refund for no-shows; refund if cancelled or rescheduled; failed payments reversed in 5 to 7 working days.
- **Bonuses:** none shown. The `BONUSES` list in `content.ts` is deliberately empty until the client confirms.

## 8. Deploy guide (short; full steps in README.md "Run it on a server")
1. **Server:** Node.js 20.9+ (22 LTS) and git. `git clone` the repo (private: add her husband's GitHub account as a collaborator, or use a deploy key).
2. **Settings:** `cp .env.example .env` and fill in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SITE_URL`, `WEBINAR_WHATSAPP_URL`, optional `RAZORPAY_BRAND_NAME`, `FIREBASE_*`, Meta, Upstash.
3. **Build and run:** `npm ci && npm run build && npm start` (port 3000; `npm start -- -p 8080` for another). Keep it running with pm2 (`pm2 start npm --name webinar -- start`, `pm2 save`, `pm2 startup`).
4. **HTTPS:** nginx or Caddy in front with Let's Encrypt, proxy to `127.0.0.1:3000`, pass `X-Real-IP` and `X-Forwarded-For`.
5. **Razorpay:** webhook `https://<domain>/api/webhooks/razorpay` (order.paid + payment.captured, secret = `RAZORPAY_WEBHOOK_SECRET`); payment capture Automatic.
6. **Firestore:** Native mode, `asia-south1`, publish `firestore.rules`, service-account key into the three `FIREBASE_*` settings.
7. **After deploying, check:** `curl -I https://<domain>/` (headers), `/api/health`, a Test Mode payment (WhatsApp button on the thank-you page, row in `registrations`, `/already-paid` on a repeat), `/thank-you` "confirmed" only for a PAID order, and the share preview (Facebook Sharing Debugger).
8. **Updates:** `git pull && npm ci && npm run build && pm2 restart webinar`.
