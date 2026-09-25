# Priyadharsini Saffron Webinar Landing Page: Plan (Phase 1, before build)

Status: **planning only. We build after the Pinterest references, footage, and transcripts are in.**

---

## 0. What I learned from her Instagram (@priyadharsini_subramaniam_)

- 39.4K followers, verified. Bio: Startup Strategist · Resource person EDIITN · 5+ yrs agribusiness · Alumni EDII Ahmedabad + TNAU · Spl. New Enterprise Creation.
- Content is **Tamil / Tanglish**. The top series is **"Day X of building our saffron farm"** (Amma's dream *kunguma poo* farm). It runs from Day 2 in June 2026 to Day 58 in Sept 2026.
  - "Day 15 of Indoor Saffron Farming registration" got **30K likes**. "Day 2 of building Amma's dream" got **26K likes**. These are her strongest hooks.
- Other posts: "Growing saffron twice a year", "Real Saffron Test", "Effective corm utilisation strategy", and a stall at **United Agritech 2026, Madurai** (services listed: turnkey indoor projects, ISO 3632 quality, training, loan/project documentation, franchise & buy-back).
- Highlights: **Webinar reviews** (use these as testimonials), **Saffron series**, **RKVY-RAFTAAR**.

**Design insight:** the saffron flower (crocus) is *violet*, with *red-orange* stigmas. So the violet-pink mesh theme is the flower itself, and the saffron red-gold is the accent colour for CTAs and prices. The page's colours tell the story.

**Brand (no logo):** a typographic wordmark, **"Priyadharsini · Saffron"**, set in a serif with a small crocus glyph. It's built in CSS/SVG and needs no logo file.

---

## 0b. Theme (updated): business-premium, light, soft colour

The user asked for a business feel, white allowed, and no exaggerated pink or purple.
- **Base:** white `#FFFFFF` / ivory `#FBF9FC`. Sections are mostly light.
- **Ink:** deep aubergine `#1E1530` for headings and body, `#5B5270` for secondary text.
- **Soft brand washes (low saturation):**
  - lilac `#E9E3F5`
  - blush `#F6E6EE`
  - dusty violet `#7B6BA8`
  - dusty rose `#C27A9A`
- **Mesh gradient:** very soft lilac / blush / cream blobs drifting on white, with fine grain. One deep-plum band (`#241634 → #3A2352`) for the offer and payment zone gives contrast. Every band is feathered in and out, with no hard edges.
- **Accent, used sparingly:** saffron `#D9531E` and gold `#E8A33D`, only for CTAs, prices and key numbers.
- **Type:** a serif display face for headlines (editorial, trustworthy) plus a clean sans for body and numbers (business).
- **Imagery:** her real farm footage for proof, plus AI images for concept and mood (listed in `assets-inbox/AI-IMAGES.md`).

## 1. The offer, rewritten with Hormozi's rules (simple words)

Principles used (from the local Hormozi corpus):
- **Value = (Dream outcome × Likelihood) ÷ (Time delay × Effort).** Every section raises likelihood (her real farm) or cuts effort/time (step-by-step plan). [video @90s](https://www.youtube.com/watch?v=SLA-q8HdZTE&t=90s), [@180s](https://www.youtube.com/watch?v=SLA-q8HdZTE&t=180s)
- **Paid beats free:** a paid workshop (~$99 in his example) brings in better-qualified buyers than a free webinar. At ₹90 we get the buyer signal and still keep friction low. [video @360s](https://www.youtube.com/watch?v=kgvGUBhEG70&t=360s)
- **Headline + "even if…" sub-headline** that names their biggest fears. [video @270s](https://www.youtube.com/watch?v=q4vu2_mPpoc&t=270s)
- **One link, one action.** Remove every other exit. [video @270s](https://www.youtube.com/watch?v=S45XRAUHhkE&t=270s)
- **A PS at the end, plus an "away statement" (who this is NOT for).** Headline, first line, and PS are the most-read parts. [video @360s](https://www.youtube.com/watch?v=1zffoe9SaSg&t=360s)
- **Scarcity = limited units, urgency = limited time.** Only **real** ones: a real date and a real seat cap. No fake timers. [video @270s](https://www.youtube.com/watch?v=SLA-q8HdZTE&t=270s)

### What the two ads change (transcripts in `assets-inbox/09-transcripts/`)
- **Date:** Sunday, 4 October 2026, live. **Price in both ads is ₹99, not ₹90**, so the page must show the same number as the ad.
- **The webinar isn't a saffron-farming course.** It's about **investing your money smartly to start and grow a business and build wealth**. Her indoor saffron farm is the **proof** ("I built this, here's how I invested and built capital"). The page is positioned as a wealth-and-business webinar with the saffron farm as the credibility engine.
- **Language:** both ads are Tanglish, so the hero headline and CTA are Tanglish to match what people just heard, and the details are in simple English.
- **Message match per creative** (`utm_content`):
  - `creative_a` (investor angle): *"Naan epdi invest panni Kunguma Poo farm build panen. Adhe madhiri unga money-a invest panni, unga business-ku capital & wealth build panradhu epdi-nu live-aa solli tharen."*
  - `creative_b` (women angle): *"Oru woman-aa business start panna periya investment-um, periya space-um thevai illa."* Sub-line: small scale-la start pannunga, smart-aa invest pannunga, wealth build pannunga.
  - No/unknown utm: creative A copy (broader).
- **Urgency is real:** a fixed date (Oct 4) → live countdown to the actual session start (true urgency, not fake).

### Draft copy (older, before the ads; the hero now follows the message match above)
- **Eyebrow:** Live Tamil Webinar · ₹90 only
- **Headline:** Start Your Own Indoor Saffron Business, From Idea to First Harvest.
- **Sub-headline:** The exact plan, costs, loans & government subsidies. Learn it from someone building her saffron farm in Tamil Nadu right now, **even if you have no farming background and no big capital.**
- **CTA:** Reserve My Seat for ₹90 →
- **Micro-trust under CTA:** 🔒 Secure payment by Cashfree · UPI / Cards / Netbanking · Seat confirmed instantly on WhatsApp + email

### The 6 modules in simple words
| # | Original | Simple version |
|---|---|---|
| 01 | How to Start a Business | **Idea → Plan.** Turn "I want to start" into a clear 30-day action plan. |
| 02 | Investment Planning | **How much money, really?** What to spend on first, and what can wait. |
| 03 | Capital Management | **Don't run out of cash.** Simple rules to handle money every month. |
| 04 | Identifying Market Opportunities | **Who will buy?** Find the demand before you invest a rupee. |
| 05 | Business Loans & Govt Subsidies | **Free & cheap money.** Loans and subsidies you can actually apply for, and how. |
| 06 | Business Growth & Wealth Creation | **From one unit to wealth.** Scale profit and build long-term wealth. |

### Value stack (**needs client approval, nothing is published without it**)
- Live 2-hr webinar (6 modules): main offer
- Live Q&A with Priyadharsini
- Bonus 1: Saffron startup cost checklist (PDF)
- Bonus 2: Loan & subsidy document checklist
- Bonus 3: WhatsApp community access
- Bonus 4: Replay for 48 hrs (only if she agrees)
- Guarantee (optional): "Not worth 10× the ₹90? Message us within 24 hrs and we refund." A guarantee only goes on the page if she will actually honour it.

---

## 2. Section blueprint: a different layout for every section

The whole page sits on **one continuous violet→pink animated mesh gradient** (CSS/WebGL, grain overlay). Sections never get hard edges. Each section's tint fades in and out with `mask-image: linear-gradient(transparent, #000 15%, #000 85%, transparent)` (the "feather" blend), so the page reads as one flowing surface.

| # | Section | Layout | Purpose (Hormozi lever) |
|---|---|---|---|
| — | Sticky top bar + mobile sticky bottom CTA | Slim glass bar | Keeps the one CTA always visible |
| 1 | **Hero** | Asymmetric split: headline left, looping farm video/portrait right with floating glass stat chips (39.4K · Day 58 · ISO 3632) | Dream outcome + instant credibility |
| 2 | Proof marquee | Infinite horizontal ticker | "EDII Ahmedabad · TNAU · EDIITN Resource Person · United Agritech 2026 Madurai · RKVY-RAFTAAR" |
| 3 | **"This is my farm"** authority | Bento grid of video tiles (setup, blooms, harvest, jar, expo) | Likelihood ↑: real, not theory |
| 4 | The problem | Two-column contrast: "Most people…" vs "You, after this webinar…" | Names the fears (money, loans, no market) |
| 5 | **What you'll learn** | 6 numbered glass cards: 3×2 on desktop, swipe carousel on mobile | Clarity: effort ↓ |
| 6 | Her journey, Day 1 → Day 58 | Vertical scroll-timeline with reel thumbnails | Story + proof it's happening now |
| 7 | Value stack | Receipt-style stacked list with strikethrough, ending in ₹90 | Price anchoring |
| 8 | **🎯 #join: Payment** | Centered glass checkout card (Name, Email, WhatsApp, consent) → Cashfree | The conversion point. **Meta ad traffic auto-scrolls here** |
| 9 | Webinar reviews | Masonry wall of screenshots/video testimonials | Social proof right after the ask |
| 10 | For you / Not for you | Split with ✓ / ✕ | Away statement |
| 11 | About Priyadharsini | Editorial: big serif pull-quote + portrait + credentials | Trust |
| 12 | FAQ | Accordion | Kills last objections (language, replay, refund, timing) |
| 13 | **About the webinar** (final) | Big ticket-style card: date · time · platform · language · ₹90 + final CTA | What you asked for "at the end" |
| 14 | PS + footer | Plain text PS, policy links | Most-read line after the headline |

### Meta-ads behaviour
- If the URL has `fbclid` or `utm_source=facebook|instagram|meta`, the page smooth-scrolls to **#join** after first paint. It respects `prefers-reduced-motion`. A small "↑ See who's teaching" pill lets people scroll back up.
- **Two creatives → message match:** `utm_content=creative_a` / `creative_b` switches the headline on the payment card to echo the ad they clicked (decided after the ad transcripts are in).
- A mobile sticky bottom bar reads "₹90 · Reserve seat". It appears once the payment card scrolls out of view.

### After payment
`/thank-you?order_id=…` checks the payment **on the server** with Cashfree. It never trusts the URL. Once verified, it shows ✅ Seat confirmed, a WhatsApp group join button, and Add to Google Calendar. If the payment isn't verified, it shows "payment pending" and a retry option.

### Pages Cashfree needs before approving the merchant
Cashfree KYC checks the site, so we build these too: **Privacy Policy, Terms & Conditions, Refund/Cancellation Policy, Contact Us** (with a business address), and a visible price.

---

## 3. Tech & deployment
- **Next.js (App Router) + TypeScript + Tailwind**, with Framer Motion for scroll reveals. Payments are server-side in Route Handlers.
- Deploys to **Vercel** (zero config), **Render** (Node web service), and **Firebase App Hosting** (supports Next.js natively). The secret keys live only in each platform's env vars.
- Performance budget for ad traffic: LCP < 2.0s on 4G. The hero video uses a poster image + lazy MP4/WebM, fonts are self-hosted via `next/font`, and the images are AVIF/WebP.

## 4. Security
See §6 (filled in from the security research).

---

## 5. Pinterest keywords

Search each one. Save 3–5 pins per group into `assets-inbox/10-pinterest-references/`.

**Overall look**
- mesh gradient landing page
- purple pink gradient website design
- aurora gradient hero section
- grainy gradient web design
- dark violet UI design
- glassmorphism landing page
- Gen Z website design
- modern course landing page
- webinar landing page design
- creator personal brand website

**Sections**
- bento grid website layout
- hero section with portrait and stats
- floating cards hero section UI
- testimonial wall masonry UI
- scroll timeline web design
- pricing card glassmorphism
- value stack sales page
- checkout form UI mobile
- FAQ accordion design
- event ticket card UI
- sticky mobile CTA bar

**Typography & brand**
- editorial serif typography web
- big bold typography landing page
- wordmark logo serif minimal
- saffron branding / crocus flower branding
- luxury agriculture brand identity

**Mood**
- saffron flower photography purple
- indoor vertical farming aesthetic
- agritech website design

Tip: the same keywords also work on **Dribbble**, **Behance**, and **Framer templates**, where the results are closer to buildable web UI.

---

## 6. Security plan

### Payment flow (money can't be changed or redirected)
1. The browser sends **only** name / email / WhatsApp / consent to `POST /api/orders`. It **never sends the amount**.
2. The server rate-limits the request, validates it with `zod.strict()`, **hard-codes ₹90.00 INR**, creates a UUID `order_id`, builds `return_url` from the `SITE_URL` env var (never from the request), and calls Cashfree `POST /pg/orders` with an idempotency key.
3. The server returns **only** `payment_session_id` to the browser, which then opens Cashfree's official SDK (`@cashfreepayments/cashfree-js`, loaded from `sdk.cashfree.com`).
4. On `/thank-you`, the server calls Cashfree `GET /pg/orders/{id}` and checks `status === PAID` **and** `amount === 90.00` **and** `currency === INR`. The URL is never trusted.
5. The webhook at `/api/webhooks/cashfree` verifies an HMAC-SHA256 signature over timestamp + **raw body** with a constant-time compare, rejects stale timestamps, and dedupes retries.
6. The Cashfree keys live **only** in server env vars (`import "server-only"`, never `NEXT_PUBLIC_`). So the payment can only reach the account whose keys are on the server.

### The 17 mistakes AI-generated payment code usually makes, all blocked
Each item is one of those mistakes, followed by what we do instead.
- **Client-side amount:** the server hard-codes the amount.
- **Secrets in `NEXT_PUBLIC_`:** secrets stay server-only, with a build check.
- **"Paid" read from the URL:** the server verifies with Cashfree.
- **Unsigned webhooks / JSON-parsed body:** we verify HMAC on the raw body.
- **No amount/currency re-check:** we re-check on every verification.
- **Open redirects:** redirects are built only from `SITE_URL`.
- **Missing headers:** we set a CSP with nonce + `strict-dynamic`, HSTS, `frame-ancestors 'none'`, nosniff, Referrer-Policy, and COOP. This uses **`@nosecone/next`** (arcjet, maintained) plus the official Next.js CSP guide. `next-safe` was archived in Dec 2025, so we don't use it.
- **PII in URLs:** we pass only an opaque `order_id`.
- **Raw PII to the Meta Pixel:** we send SHA-256-hashed data via server-side CAPI, deduped with `event_id = order_id`.
- **PII in localStorage:** we never store it there.
- **Verbose errors:** the client only sees generic messages. Detail stays in server logs, and those logs contain no secrets and no raw PII.
- **Duplicate orders on double-click:** we use an idempotency key and a disabled button.
- **No rate limit (card-testing):** we rate-limit per IP with `@upstash/ratelimit`, which works on Vercel, Render, and Firebase.
- **`CORS *`:** our API is same-origin only.
- **Hallucinated or typosquatted packages:** we use only verified official packages, pin versions, commit the lockfile, and run `npm audit`.
- **`dangerouslySetInnerHTML` and missing `rel="noopener"`:** we never use `dangerouslySetInnerHTML`, and every external link gets `rel="noopener"`.
- **Honeypot + consent:** the form gets a honeypot field and a time-to-submit check.

### Data & privacy (India DPDP Act 2023 / Rules 2025)
- A clear notice sits next to the form: what we collect (name, email, WhatsApp), why (webinar access + reminders), how to withdraw consent, and a contact.
- Consent for **marketing and ads tracking** is a **separate, unticked** checkbox.
- The Meta Pixel loads only after consent. Purchase measurement goes through server-side CAPI with hashed data.
- Behaviour analytics are optional: Vercel Analytics (cookieless) and/or Microsoft Clarity (masks inputs by default).

### Go-live gotcha
Cashfree production only works on a **whitelisted custom domain** (https, approval takes about 24 h). `*.vercel.app`, `*.onrender.com`, and `*.hosted.app` may be rejected, so **buy the domain early**.

---

## 7. What I need from you: footage & info

Drop the files into `assets-inbox/` with **exactly these names** (any extension: .mp4/.mov/.jpg/.png). Vertical 9:16 is fine, and horizontal 16:9 as well is even better.

### 01-hero/
- `hero-portrait.jpg`: waist-up, looking at camera, clean background (ideally purple light like her profile pic). Highest resolution possible.
- `hero-loop.mp4`: 8–15 s, **no talking needed**. Her walking through or tending the indoor saffron racks. Must loop smoothly.

### 02-farm-authority/
- `farm-setup-wide.mp4`: the whole indoor room (racks, lights, AC/humidifier)
- `saffron-bloom-closeup.mp4`: violet flowers opening, macro
- `harvest-stigma.mp4`: hands picking the red stigmas
- `saffron-jar.jpg`: finished dried saffron in a jar / on a plate
- `corms-trays.jpg`: corms in trays
- `real-saffron-test.mp4`: clip from the "Real Saffron Test" reel

### 03-journey-days/
- `day-02.mp4`, `day-15.mp4`, `day-30.mp4`, `day-58.mp4` (or whichever days you have). A 3–5 s best moment from each is enough.

### 04-credentials-events/
- `expo-madurai-stall.jpg`: United Agritech 2026 stall
- `edii-ahmedabad.jpg` / `tnau.jpg`: certificates or campus photos (optional)
- `ediitn-speaking.jpg`: her speaking as a resource person
- `rkvy-raftaar.jpg`: anything from that highlight

### 05-testimonials/
- `review-01.png` … `review-10.png`: screenshots from the "Webinar reviews" highlight (**get consent** before showing names/faces)
- `video-testimonial-01.mp4` (optional, gold if available)

### 06-about/
- `about-portrait.jpg`: a second portrait, different from the hero
- `whiteboard-planning.jpg`: her explaining at a whiteboard (like the Day 15 reel)

### 07-intro-video/ (**biggest conversion lever**)
- `intro-60s.mp4`: 60–90 s selfie video: "Who I am → What you'll learn → Why ₹90 → Join now". Add an `.srt` file if available.

### 08-ad-creatives/
- `creative-a.mp4`, `creative-b.mp4`: the two Meta ads

### 09-transcripts/
- `creative-a.txt`, `creative-b.txt`, `intro-60s.txt`

### Info (reply in chat)
1. ~~Date~~ (Sun 4 Oct 2026 ✅) · **start time, duration** · language (Tamil assumed) · **price: ₹90 or ₹99?** (the ads say ₹99)
2. Platform: Zoom / Google Meet / YouTube Live?
3. Seat limit (real number), and whether there's a replay
4. Refund policy and whether she accepts the guarantee
5. Which bonuses she can actually deliver
6. WhatsApp group link for buyers (separate from the public one in her bio)
7. Legal business name, address, support email/phone (for the policy pages and Cashfree KYC)
8. Domain name (e.g. `priyadharsinisaffron.in`), and which host we launch on first: Vercel, Render, or Firebase?
9. Meta Pixel ID (later) and whether to save leads to a database (Firebase Firestore or Supabase) or just use the Cashfree dashboard
