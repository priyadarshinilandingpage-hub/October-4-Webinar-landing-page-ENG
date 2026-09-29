# Next chat: full test, fix, then push (30 Sep 2026)

## 1. Paste this into the new chat

```
Continue the Priyadharsini saffron webinar landing page in C:\Users\shyam\Downloads\PRIYADARSINI-LANDING-PAGE.
Read NEXT-CHAT-HANDOFF.md fully first, then HANDOFF.md (all of it, especially sections 2, 9, 10 and 11).
Your job, in this order:
1. Run every check and test in section 4 of NEXT-CHAT-HANDOFF.md. Take as long as needed. Be very accurate:
   look at every page visually (screenshots at phone, tablet and laptop sizes, dark and light theme, Tamil "/"
   and English "/en"), think about what a real visitor sees, and check the logic (payment flow, popups, timers).
2. Fix every problem you find, then re-run the checks until everything passes. Report what you found and fixed.
3. Only after everything passes: do section 5 (push the Tamil site to the existing repo and the English site
   to the new ENG repo). Show me the result and confirm both GitHub repos match the local code.
Follow my rules in section 6 strictly. Explain things to me in simple words.
```

## 2. State right now (30 Sep 2026, ~4 AM)

- **Nothing since commit `b5e7525` is committed.** About 46 files are changed or new (redesign rounds 3 to 7 of 30 Sep, listed in HANDOFF.md §10 and the "round" bullets at the end of §9/§10).
- **Remotes:**
  - Tamil site (existing): `origin` = https://github.com/priyadarshinilandingpage-hub/October-4-Webinar-landing-page.git (private).
  - English site (new, empty, private): https://github.com/priyadarshinilandingpage-hub/October-4-Webinar-landing-page-ENG.git
- **Local preview:** `npm run build`, then launch config **"prod"** (`npm start -- -p 3100`). **After every build, restart the "prod" server.** On 30 Sep a rebuild under a running server made `/en` load a stylesheet that no longer existed (404), so the page showed as bare HTML with a giant photo. It was not a code bug; a restart fixed it.
- **Live site:** https://priya-saffron.phenolens.com (still the old version; her husband deploys with `git pull && npm ci && npm run build && pm2 restart webinar`).
- **Meta pixel:** dataset ID `4638751303076020`, CAPI token sent to her husband privately. The `.env` lines are in HANDOFF.md §11. The pixel is **not live** until he deploys with them.

## 3. What changed on 30 Sep (so you know what to test)

- **Look:** violet and white only (every orange/gold/pink/green/blue mapped to violet shades; only form-error red stays). **Dark violet is the default**; the sun/moon toggle switches to light and remembers it (cookie `theme`).
- **Top of every page:** urgency strip (`components/UrgencyBar.tsx`): LIVE date, real countdown to Sun 4 Oct 11:00 AM IST, ₹9,500 struck + ₹99, "Book now". Top bar is 70 px (`--topbar-h`).
- **Section order:** Hero → marquee → value receipt + payment form → reviews → farm → problem → modules → journey → fit → about → FAQ → ticket → PS.
- **Prices:** `<PriceTag>` (₹9,500 struck, ₹99 big) in hero, admit card, ticket, mobile bottom bar; every CTA stub shows ₹9,500 beside ₹99 (`.cta-was`). Receipt totals 6 modules × ₹1,000 + recording ₹2,000 + saffron intro ₹1,500 = ₹9,500. **The price is ₹99 only; never change it.**
- **Instagram card** (`components/InstagramProfile.tsx`): dark violet glass card in the hero, her Instagram avatar enlarged (`public/media/instagram/profile-480.jpg`), handle on one line, 77 posts / 40.1k followers / 8 following, bio. Not in About any more.
- **Popups:** `LandingToast` (3 s after landing, once per visit, pulsing Register, ✕, hides at the form) and `RegisterNudge` (after 25 s or desktop exit intent, once per visit, value list, ₹9,500 → ₹99, countdown, ✕ and "No thanks"). Top-bar Register button pulses (`CtaLink pulse`).
- **Booked count:** `/api/seats` returns real paid orders; `<SeatsLeft>` shows "N people have already booked" only from 20 up. No seat limit exists.
- **English page:** `/en` (`app/en/page.tsx`, `data-lang="en"`, `<ByLang>` in `components/ui.tsx`). Hero, section titles, buttons, quote, PS, popup in plain English.
- **Form:** Name, WhatsApp, Email (optional). Refund line under the button.
- **Thank-you page:** 3 numbered steps; "You must join the WhatsApp group to attend"; meeting link only in the group; recording link later in the same group.
- **Speed:** background blobs static, petals fade once, saffron thread drawn once (no scroll listener), max 2 decorative videos play at once (`LazyVideo`).
- **HDR fix:** 5 videos re-encoded from HLG/BT.2020 to SDR BT.709 (hero-loop, hero-loop-small, farm-setup-wide, harvest-stigma, journey/day-02). Phones no longer dim the page when they play.
- **Ad visitors** (URL has `utm_source` or `fbclid`): the intro video does not auto-open.

## 4. Test plan (do all of it; fix anything that fails; repeat)

**A. Code checks**
1. `npx tsc --noEmit` (no errors), `npx vitest run` (all pass, currently 80), `npm run build` (passes, includes `client bundle check passed`), `npm run check:placeholders` (report what's left).
2. Grep visible copy (`components/content.ts`, page components) for `—`, spaced `–`, `Nº`, `§`, `Fig.`: none allowed.
3. Grep `/en`'s rendered text for Tanglish words (pannunga, epdi, illa, unga, idhu, solli, -aa): none allowed.

**B. Every page loads** (restart "prod" after building): `/`, `/en`, `/dark`, `/thank-you`, `/already-paid`, `/privacy`, `/terms`, `/refund`, `/api/health`, `/api/seats`. Every CSS/JS file referenced must return 200 (check with curl and in the browser's network log). No console errors.

**C. Visual check** (use a background tab; screenshots plus DOM measurements) at **375×812, 768×1024, 1280×800, 1920×1080**, in **dark and light**, for **`/`, `/en`, and `/?utm_content=creative_b-women`** (women headline must show):
- No horizontal scroll (`scrollWidth === clientWidth`), nothing cut off or overlapping, no text over text.
- Urgency strip readable; countdown ticks; top-bar Register + ₹9,500/₹99 stub fits.
- Hero: headline, sub-line, price line, button, Instagram card (avatar big and round, handle on one line, bio column on wide screens, stacked on phones).
- Receipt: every line value readable, ₹9,500 struck, ₹99 big; payment card price fits inside its card.
- Every colour is violet/white (report any orange, gold, green, pink, blue that remains; photos and videos excluded).
- Light theme looks right too (toggle, reload, it stays).
- `/thank-you` and `/already-paid` still use a plain white page; check they match the violet look and the 3 steps read clearly on a phone.

**D. Behaviour**
- Landing banner appears ~3 s after load, once per visit (sessionStorage `toast-seen`), ✕ closes, Register scrolls to the form and focuses Name, hides when the form is on screen.
- Popup opens after 25 s (or exit intent on desktop), not over the form or video, ✕ / "No thanks" / Esc / backdrop close it, focus returns.
- Intro video: auto-opens for organic visitors only; never for `?utm_source=meta` or `?fbclid=…`.
- Only 2 decorative videos play at once while scrolling (check `video` elements' `paused` state).
- Form: Name + WhatsApp only (email empty) passes validation; bad phone, bad email and missing consent show the right error; bot trap still rejected. Run the vitest suites for orders/validation/seats.
- **Payment dress rehearsal without real keys** (HANDOFF.md §6 describes it): start `next start` with fake Razorpay keys as env vars and `NODE_OPTIONS=--import <mock-rzp.mjs>` patching `fetch` for api.razorpay.com. Check: order at exactly 9900 paise, callback 303 to /thank-you, thank-you shows the 3 steps + WhatsApp button only when PAID, failed/cancelled/pending states, repeat buyer (same phone) goes to /already-paid, `/api/seats` count goes up by one per buyer. Delete the mock script afterwards (never commit it).
- **Pixel**: build once with `NEXT_PUBLIC_META_PIXEL_ID=4638751303076020` in a **temporary** env (not a committed file) and confirm `fbevents.js` loads after page load, CSP allows `connect.facebook.net`, PageView fires, InitiateCheckout fires when Razorpay opens. Then rebuild without it (the real value goes only in the server's `.env`).

**E. Performance (phone)**: in a 375 px tab with CPU throttling if available, scroll the whole page; report long tasks and whether anything still animates forever besides the countdowns, the marquee and the pulse rings.

## 5. Push (Shyam already said yes: push BOTH repos once every check in section 4 passes)

1. **Tamil site → existing repo:** `git add -A` (never add `.env`, `data/`, mock scripts), commit with a clear message ending in the attribution line the environment asks for, `git push origin main`, then `git fetch origin && git status` must say "up to date" and `git log origin/main -1` must match local.
2. **English site → new ENG repo.** It must work as its own website, with English on `/`:
   - Add a build setting so one codebase serves either language: e.g. `NEXT_PUBLIC_SITE_LANG=en` makes `app/page.tsx` render `<LandingPage lang="en" />` (and `<html lang="en">`, English title/description in `app/layout.tsx`). Default stays Tamil. Add it to `.env.example` with a comment. Test both builds.
   - `git remote add eng https://github.com/priyadarshinilandingpage-hub/October-4-Webinar-landing-page-ENG.git` then `git push eng main`. Confirm `git log eng/main -1` matches.
   - Tell the user: the English server's `.env` needs `NEXT_PUBLIC_SITE_LANG=en` plus the same Razorpay, WhatsApp and Meta settings, and it must be a **separate domain/subdomain** with its own `SITE_URL` (Razorpay callback + CSP depend on it). Note the already-paid list is per server.
   - (Ask first if the user would rather have the English site as a folder in the same repo; on 30 Sep they settled on the separate ENG repo.)
3. Remind the user: her husband must deploy (`git pull && npm ci && npm run build && pm2 restart webinar`) with the pixel lines in `.env` (HANDOFF.md §11), then do one ₹99 test payment and check Events Manager > Test events.

## 6. The user's rules (strict)

- Simple words; short updates. The user is Shyam (runs the ads); her husband runs the server (evenings).
- No em dashes, spaced en dashes, "Nº", "§" or "Fig." in visible text; no filler micro-text; dense layouts.
- Violet and white only; dark violet default with light toggle.
- Smooth on low-end phones: animate transform/opacity only; no heavy filters or blur.
- Don't move or reload the user's own browser tab; test in a background tab. Laptop lags: one heavy job at a time, ffmpeg `-threads 2`.
- Price is ₹99 only.
- **Do not build a fake or random "only N seats left" counter.** The user asked several times; it was declined each time because a made-up scarcity number is prohibited under India's CCPA dark-pattern guidelines (2023) and risks Meta rejecting the landing page. Honest urgency only: the real countdown, a real bonus deadline if she will honour it, a real seat cap if one exists (the platform isn't decided yet; Zoom/Meet basic plans cap at 100), the real booked count.
- Push only after all tests pass (Shyam's standing yes for this one push of both repos). Never push `.env`, tokens, the WhatsApp link or the CAPI token.

## 7. Open decisions for the user

- Urgency: platform/seat cap (then "N of 100 seats left" from real payments), bonus deadline time, "registration closes Sun 10 AM".
- Reorder sections to promise → plan → proof → ask (Hormozi), and add an "even if you've never run a business and don't have big capital" line under the headline.
- A sharper original of her Instagram profile photo (current file is upscaled from 150 px).
- Privacy, Terms, Refund pages are still empty (client writes them; Razorpay and Meta may check them).
