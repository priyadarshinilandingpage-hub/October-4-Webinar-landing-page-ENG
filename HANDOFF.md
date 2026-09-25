# HANDOFF: Priyadharsini · Saffron & Business webinar landing page

Last updated: 26 Sep 2026 (second chat: already-paid block, Firebase, Resend, Meta Pixel). Read this whole file before doing anything. It is the memory of the previous chat.

---

## 0. Paste this into the new chat to continue

```
Continue the Priyadharsini saffron webinar landing page in C:\Users\shyam\Downloads\PRIYADARSINI-LANDING-PAGE.
First read HANDOFF.md in the project root fully, then PLAN.md §0b/§6, then run:
  npx tsc --noEmit ; npx vitest run ; npx next build ; node scripts/check-client-bundle.mjs
Fix anything that fails. Then check the "OPEN ITEMS" list in HANDOFF.md §6 and continue from the first
unchecked item. Follow the user's rules in HANDOFF.md §2 strictly (no em dashes, no "Nº", no "§", no "Fig",
no AI-looking filler text, dense layouts, smooth on low-end phones, never move my browser view: test in a
background tab). When I say "deploy", follow HANDOFF.md §8.
```

---

## 1. What this is
- A single-page, conversion-focused landing page selling a **₹99 live Tamil webinar** ("Start Small, Invest Smart, Build Wealth") by **Priyadharsini Subramaniam**, a startup strategist building an **indoor saffron (kunguma poo) farm in Tamil Nadu**. The date is **Sun 4 Oct 2026, 11:00 AM IST** (start time still to be confirmed by the client).
- Traffic comes from **Meta ads** (two ads in the brief). The page message-matches `utm_content=creative_b` (women angle); everything else gets creative A (investor angle).
- Payments go through **Cashfree** (the merchant account belongs to a third party; keys come later through env vars).
- Deploy targets: **Vercel, Render, Firebase App Hosting** (configs exist).

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
- **Stack:** Next.js **16.3.6** (App Router, `proxy.ts` not middleware), React 19.3, Tailwind 4, TypeScript 5.9, motion 13, zod 4, vitest 5, `@nosecone/next` (CSP with nonce), `@cashfreepayments/cashfree-js`, `@upstash/ratelimit` (optional).
- **Fonts** (next/font, self-hosted): Bricolage Grotesque (display), Fraunces italic (accent), DM Sans (body), IBM Plex Mono (labels, not preloaded).
- **Page:** `app/page.tsx` → `components/LandingPage.tsx`. It always uses `data-type="bold"`, the theme comes from `?theme=` or the cookie, and the variant from `utm_content`.
- **Copy and media slots:** `components/content.ts`. Price and date: `lib/offer.ts` (single source of truth, ₹99). Business details: `lib/business.ts` (placeholders still there).
- **Sections:** `components/sections/*.tsx` (Hero, ProofMarquee, FarmBento, Problem, Modules, Journey, ValueStack, JoinSection, Reviews, Fit, About, Faq, Ticket, PsFooter), with helpers in `Fx.tsx` (data-fx idle/armed/in reveal states) and `fxStyle.ts`.
- **Styles:**
  - `app/globals.css`: tokens and dark theme, plus the appended blocks: scrollbar, PC text sizes, auto-scroll curtain, video spotlight, ticket print animation, theme toggle, performance guard.
  - `app/sections.css`: section layouts.
  - `app/bold.css`: bold typography, flowers, and hero headline sized with container queries `cqi` so the bouquet fits beside it.
  - `app/overlays.css`: review lightbox.
- **Media:** `components/Media.tsx` supports `srcDark`/`posterDark` (AI loops swap by theme); `components/LazyVideo.tsx`.
- **Security (already done, don't weaken):**
  - The server fixes the ₹99 price and re-verifies with Cashfree.
  - Webhook HMAC is checked on the raw body; IDs are validated.
  - CSP with nonce is set in `proxy.ts`; `next.config.ts` covers API headers and `allowedDevOrigins` for the LAN.
  - Rate limits in `lib/ratelimit.ts`; no PII in URLs or localStorage.
  - Tests are in `test/` (103 passing, 26 Sep 2026).
  - `scripts/check-client-bundle.mjs` scans browser bundles for secrets.
  - `scripts/check-placeholders.mjs` lists the remaining placeholders.
- **After a payment (added 26 Sep 2026, details in README "After a payment"):** `lib/fulfil.ts` runs from the webhook and the thank-you page once Cashfree says PAID:
  - `lib/buyers.ts`: the already-paid list (Firestore `paid_contacts`, hashed ids). The order API answers `409 { alreadyPaid: true }` for a known email **or** phone, and the form opens `/already-paid`. The user asked to match name/email/phone; name alone is deliberately NOT matched (many people share names).
  - `lib/firestore.ts`: Firestore over REST, no SDK (service-account JWT, or the Google Cloud built-in account on App Hosting). The `registrations` collection is the "rows and columns" table the user asked for. `firestore.rules` denies all browser access.
  - `lib/email.ts`: Resend over REST, no SDK. Seat-confirmation email with the WhatsApp button, once per order (idempotency key + `email_status`).
  - A failed step makes the webhook answer 503 so Cashfree retries. The thank-you page shows the big "Join the WhatsApp group" step.
- **Meta:** `components/MetaPixel.tsx` loads the Pixel on every page after the page is idle (PageView, InitiateCheckout on form submit, Purchase on the verified thank-you page, eventID = order id). The user chose **"track everyone, no asking"** (26 Sep 2026), so the Pixel has no consent gate, CAPI Purchase goes for every buyer, and the privacy page says so. `META_DOMAIN_VERIFICATION` adds the domain meta tag.

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
- **Dev:** the preview config `.claude/launch.json` runs `npm run dev -- -H 0.0.0.0` on port 3000. `web-prod` runs the last `npm run build` with `next start` on port 3100: use it for QA when another chat's dev server holds port 3000 (stop it before rebuilding).
- **Local payment test:** needs `.env.local` with Cashfree **sandbox** keys (none exist yet). Test UPI `testsuccess@gocash`; test card 4706 1312 1121 2123, 03/28, CVV 123, OTP 111000.
- **On the user's phone (same Wi-Fi):** `http://192.168.1.4:3000/` and `/dark`. The IP can change; check it with `ipconfig`.
- **QA:** use a background browser tab (`tabs_create`, then `navigate`, then `resize_window` on that tab). The pane is often hidden, so screenshots can time out; rely on DOM measurements (getBoundingClientRect, elementFromPoint).
- **Useful test URLs:**
  - `/?utm_content=creative_b&fbclid=x` (ad B plus auto-scroll);
  - `/?theme=dark`;
  - to bypass auto-scroll, run `sessionStorage.setItem('as-join','1')` in the console.

## 6. OPEN ITEMS (continue from the first unchecked one)
- [x] **Density pass, mostly verified 26 Sep 2026** (production build, background tab, DOM measurements): no horizontal scroll at 375 / 768 / 1024 / 1280 / 1440 / 1920 in light and dark; no em dashes, "Nº", "§" or "Fig" in visible text; `#learn-title` is 3 lines (375 and 1280); the plum band is at least 91% opaque behind its first and last text, so contrast is fine; the FarmBento note overlaps no caption. **Still open:** the floral-divider clearance (`-my-14`, about 8 px) was not measured.
- [x] **Leftovers removed (user's call, 26 Sep 2026):** "← idhu dhaan!" (the pencil circle stays), the FAQ "Q.01" tabs (card gap now 12 px), the Problem ledger's number column and "=" sign, and "Admit one" on both stubs and the LIVE seal. Don't bring them back.
- [x] **Duplicate-payment note** on the thank-you page only points to Contact; it promises no refund (user's call).
- [x] **Hero bouquet verified:** the headline ends 22 px (1024) and 26 px (1280 / 1440 / 1920) before the bouquet.
- [x] **Built:** the already-paid block, Firestore registrations, the Resend confirmation email, the WhatsApp step on the thank-you page, the Meta Pixel and CAPI for all buyers (see §3). Needs real keys to test end to end (§8).
- [x] **Ready for GitHub + Firebase App Hosting (26 Sep 2026):**
  - A standalone build (what App Hosting runs; `NEXT_PRIVATE_STANDALONE=true npm run build`, launch config `web-standalone`) serves every page with the CSP/HSTS headers from `proxy.ts`, plus the media, `/icon.svg` (new tab icon), `/og.jpg` and `/api/health`. Without keys, `/api/orders` answers 503 and the webhook 401. No CSP errors in the console.
  - `git init -b main` is done, with **no commit yet**: the user commits and pushes. `git add --dry-run .` gives 175 files, 24 MB (largest 8.3 MB). A scan of those files found no secrets.
  - `apphosting.yaml`: the first rollout needs no secrets (the Cashfree blocks are commented out, with step-by-step notes). Firestore on App Hosting needs no settings: the project comes from the automatic `FIREBASE_CONFIG`.
  - `lib/fulfil.ts`: the steps are independent, so the email still goes out if Firestore is down.
- [ ] **Verify the journey pages.** They must have **no** flying animation (PaperFlight was deleted). Code check done 26 Sep: nothing references `pf-`/`PaperFlight`. Still to look at in a browser.
- [ ] **Verify the video spotlight in a real browser.**
  - The FLIP open animation from the thumbnail works.
  - The countdown locks close for 5 s.
  - Sound toggle, Esc and backdrop work only after unlock.
  - It re-opens on every refresh.
  - It never opens during the auto-scroll.
  - Mobile layout: video plus CTA under it.
- [ ] **Verify the review lightbox:** open, next/previous, swipe, close, and focus return.
- [ ] **Performance check** on a throttled mobile profile (Lighthouse or DevTools CPU 4×). The auto-scroll glide must be smooth.
- [ ] **Client inputs still missing** (see `npm run check:placeholders`):
  - business legal name, address, support email and phone, grievance officer name and email, city, GSTIN (`lib/business.ts`);
  - confirm the 11:00 AM start time (`lib/offer.ts`) and the session length (`app/thank-you/page.tsx`);
  - a buyers-only WhatsApp group link (`WEBINAR_WHATSAPP_URL`).
- [ ] **Keys the user must create:** Cashfree sandbox keys, a Firebase project (Blaze plan) with Firestore in `asia-south1` and `firestore.rules` published, Resend (verified sending domain, API key, `EMAIL_FROM`), Meta Pixel ID + CAPI token (+ domain verification code). Full list in `.env.example`.
- [ ] **Not built:** WhatsApp *messages* to buyers (only the group link on the page and in the email). Refunds for a `duplicate_of` order are manual in the Cashfree dashboard.
- [ ] **Deploy** (§8), then do one real **Cashfree sandbox payment** end to end (row in `registrations`, email arrives, paying again opens `/already-paid`, Events Manager shows Purchase), then switch to production keys.

## 7. Known facts and decisions (don't re-ask)
- **Price ₹99** (the ads say ₹99). Language Tamil. Only the **general authority creative** is used on the page.
- **Verified facts about her** (only use these): 39.4K Instagram followers, 5+ years in agribusiness, EDII Ahmedabad and TNAU alumna, New Enterprise Creation specialisation, EDII-TN resource person, "Day X" build series on Instagram (@priyadharsini_subramaniam_), stall at United Agritech 2026 Madurai.
- **Refund policy:** the user said not to worry. Standard wording is filled in: no refund for no-shows; refund if cancelled or rescheduled; failed payments reversed in 5 to 7 working days.
- **Bonuses:** none shown. The `BONUSES` list in `content.ts` is deliberately empty until the client confirms.

## 8. Deploy guide (short; full steps in README.md)
1. **Buy or choose a custom domain.** Cashfree production only works on an https custom domain that the Cashfree account owner whitelists (approval takes about 24 h). `*.vercel.app` may be rejected.
2. **Env vars** (see `.env.example`):
   - `CASHFREE_CLIENT_ID`, `CASHFREE_CLIENT_SECRET`, `CASHFREE_ENV` (sandbox → production), `CASHFREE_API_VERSION` (2025-01-01);
   - `SITE_URL` (the exact https origin);
   - `WEBINAR_WHATSAPP_URL`;
   - optional: `UPSTASH_REDIS_REST_URL`/`TOKEN`, Meta vars.
   - Never prefix secrets with `NEXT_PUBLIC_`.
3. **Pick a host.** The user is leaning to **Firebase App Hosting** (from GitHub). Facts checked 26 Sep 2026: it needs the Blaze (pay-as-you-go) plan with a card; there is no Mumbai region (closest is `asia-southeast1` Singapore; put Firestore in `asia-south1` Mumbai); free monthly allowance is 2M requests, 180k vCPU-s, 360k GiB-s, 10 GiB bandwidth (then about $0.15/GiB); classic Firebase Hosting (free Spark plan) can't run this app because it needs a server. The whole `assets-inbox/` folder is now in `.gitignore`.
   - **Vercel:** import the folder or repo; `vercel.json` sets the region to Mumbai. `.vercelignore` already excludes `assets-inbox`, so the 26 GB of zips aren't uploaded.
   - **Render:** `render.yaml` (Node web service; build `npm ci && npm run build`, start `npm start`).
   - **Firebase App Hosting:** `apphosting.yaml` (secrets via Cloud Secret Manager).
4. If using git: `.gitignore` already excludes `assets-inbox/_raw`, zips, heic and mp4/mov in the inbox. Commit `public/media` (about 25 MB).
5. **In the Cashfree dashboard:** add the webhook URL `https://<domain>/api/webhooks/cashfree` and whitelist the domain.
6. **After deploying, check:**
   - the security headers (`curl -I https://<domain>/`);
   - `/api/health`;
   - a sandbox payment;
   - the thank-you page shows "Seat confirmed" only after Cashfree marks the order PAID.
7. **Share preview:** test the link in WhatsApp or the Facebook Sharing Debugger (the og:image needs the absolute `SITE_URL`).
