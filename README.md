# Priyadharsini · Saffron: webinar landing page

A Next.js 16 landing page that sells a ₹99 live webinar (Sunday 4 October 2026) through Razorpay, hosted on **Cloudflare Pages** (free plan: unlimited visitors, never asleep).

## Architecture

- **Pages** (`app/`): built by `next build` (`output: "export"`) into plain files in `out/`. No server renders them, so they cost nothing and never slow down under ad traffic.
  - The page carries both ads' headlines; `public/boot.js` (a tiny blocking script in `<head>`) picks ad B for `utm_content=creative_b` and applies `?theme=` / the saved theme cookie before the first paint.
  - Images: `scripts/make-images.mjs` writes WebP copies of `public/media` images at 7 widths into `public/_img/` at build time; `lib/image-loader.ts` points `next/image` at them.
- **Payment steps** (`functions/api/*` → logic in `server/`): Cloudflare Pages Functions, web-standard code only (fetch, Web Crypto). They mostly wait on Razorpay / Firebase / Resend, which doesn't count toward the free plan's 10 ms CPU limit.
  | Endpoint | Does |
  |---|---|
  | `POST /api/orders` | Validates the form, blocks repeat buyers, creates the Razorpay order for the fixed ₹99 |
  | `POST/GET /api/razorpay/callback` | Where Razorpay returns the buyer (redirect mode). Verifies the signature, starts the follow-up, sends them to `/thank-you` |
  | `GET /api/verify?order_id=` | The thank-you page's check: asks Razorpay; only a verified PAID order gets the WhatsApp link |
  | `POST /api/webhooks/razorpay` | Razorpay's server notice (signed). Re-reads the order, runs the follow-up and Meta CAPI |
  | `GET /api/health` | Uptime check |
- **Security headers**: `scripts/write-headers.mjs` writes `out/_headers` (CSP, HSTS, frame blocking, nosniff, referrer and permissions policies). `public/_routes.json` limits Functions to `/api/*`, so pages never run code. `public/_redirects` keeps old `/bold` links working.

## Local development

Requirements: Node.js 20.9+ (Cloudflare builds with Node 22, see `.node-version`).

```bash
npm ci
npm run dev        # the pages at http://localhost:3000 (the /api Functions don't run here)
npm run build      # images + static build into out/ + _headers + leak scan
npm run preview    # serves out/ like Cloudflare Pages at http://localhost:3300
npm test           # unit tests for every payment endpoint (vitest)
```

The Functions are covered by the unit tests (`test/`). To run them locally against Razorpay test keys, use Cloudflare's `wrangler pages dev out` (not installed by default).

| Script | What it does |
|---|---|
| `npm run build` | `prebuild` (blocks secret-looking `NEXT_PUBLIC_*` vars, makes image copies), `next build`, `postbuild` (writes `_headers`, scans `out/` for secrets) |
| `npm test` | Order creation, callback, verification, webhook signatures, Firestore + Resend follow-up, Meta CAPI, validation |
| `npm run check:placeholders` | Lists every `[PLACEHOLDER]` still on the policy pages. Must print nothing before go-live |

## Settings (environment variables)

Set them in Cloudflare: **Workers & Pages → the project → Settings → Variables and Secrets**. `.env.example` has the full list with comments. Mark secrets as **Secret** (encrypted). Never put a secret in a `NEXT_PUBLIC_` name.

| Variable | Required | Secret | Purpose |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | yes | no (public) | `rzp_test_…` until go-live, then `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | yes | **yes** | Razorpay key secret. Also verifies the checkout signature |
| `RAZORPAY_WEBHOOK_SECRET` | yes | **yes** | The secret you type when adding the webhook in Razorpay |
| `RAZORPAY_BRAND_NAME` | no | no | Name at the top of the checkout. Razorpay requires it to match the account's business name or the website domain |
| `SITE_URL` | yes | no | `https://your-domain.in`. Also add it as a **build** variable (share previews use it) |
| `WEBINAR_WHATSAPP_URL` | recommended | keep private | Buyers-only WhatsApp group: verified thank-you page and confirmation email only |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | recommended | key **yes** | Firestore `registrations` table + already-paid list. From a service-account key JSON (Firebase console → Project settings → Service accounts → Generate new private key). The free Spark plan is enough |
| `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_REPLY_TO` | recommended | key **yes** | Seat-confirmation email |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | no | token **yes** | Rate limits shared across Cloudflare locations |
| `META_PIXEL_ID` / `META_CAPI_TOKEN` | for ads | token **yes** | Server-side Meta "Purchase" for every verified buyer |
| `NEXT_PUBLIC_META_PIXEL_ID` | for ads | no (public) | **Build** variable: the browser Pixel, and opens the CSP for Meta |
| `META_DOMAIN_VERIFICATION` | no | no | **Build** variable: Meta domain verification meta tag |

## After a payment

Once Razorpay says an order is PAID for exactly 9900 paise INR, `server/fulfil.ts` runs three steps (from the callback, the thank-you check and the webhook; each is safe to repeat, and a failure in one doesn't stop the others):
1. **Already-paid list**: the buyer's email and WhatsApp number are saved as hashes in the Firestore collection `paid_contacts`. A later form submit with the same email **or** number gets `409 { alreadyPaid: true }` and opens `/already-paid`. Names are not matched (different people share names).
2. **Registrations table**: one Firestore document per order in `registrations`: `order_id, name, email, phone, amount, currency, status, mode, webinar_date, confirmed_at, marketing_consent, utm_source, utm_campaign, utm_content, duplicate_of, email_status, email_sent_at`. As a table: Firebase console → Firestore → **Query builder** → `registrations`. Every payment is also in the Razorpay dashboard (Transactions → Orders; the buyer's details are in each order's notes; exportable).
3. **Confirmation email** through Resend with the WhatsApp button and a calendar link, once per order.

`duplicate_of` marks a second paid order by the same person (two checkouts at once): refund it from the Razorpay dashboard. Keep `firestore.rules` (deny all browser access) published.

## How payments are kept safe

1. The browser sends only name, email, WhatsApp number and consent. The schema is `.strict()`, so an `amount` field is rejected. The server hard-codes **9900 paise INR** from `lib/offer.ts`.
2. `POST /api/orders` checks the Origin (same-origin only), content type, body size (4 KB), rate limit (10 per IP per 10 minutes), validation, a honeypot and time-to-fill. Sales stop 30 minutes after the session starts.
3. The browser gets back only public checkout details (order id, key id, amount, prefill). The key secret never leaves the server; `postbuild` scans `out/` for it.
4. "Paid" is only ever decided by asking Razorpay on the server (`GET /v1/orders/{id}`): status `paid`, amount and amount paid exactly 9900, currency INR. The address bar is never trusted.
5. The checkout signature (`HMAC-SHA256(order_id|payment_id, key_secret)`) and the webhook signature (`HMAC-SHA256(raw body, webhook_secret)`) are checked with constant-time compares; webhooks are re-checked against the API before acting.
6. Redirects are built only from `SITE_URL`. Logs hold order ids and error codes, never names, emails or phone numbers. The browser only sees generic errors.

## Razorpay setup

1. **Test mode first**: Dashboard → switch to **Test Mode** → Account & Settings → **API Keys** → Generate. Put the key id and secret in Cloudflare.
2. **Webhook**: Dashboard → Account & Settings → **Webhooks** → Add New Webhook: URL `https://<your-domain>/api/webhooks/razorpay`, a secret you make up (same value in `RAZORPAY_WEBHOOK_SECRET`), events **order.paid** and **payment.captured**.
3. **Payment capture**: Account & Settings → Payment capture → **Automatic** (orders become "paid" by themselves).
4. **Website and KYC**: the live site must show the price, Privacy Policy, Terms, Refund & Cancellation, and a Contact page whose name matches the account holder. Fill every placeholder first (`npm run check:placeholders`).
5. **Go live**: after activation, switch to Live Mode, generate **live** keys (`rzp_live_…`), replace both keys in Cloudflare, add the webhook again in Live Mode, and redeploy. Pay ₹99 once yourself and refund it.

Test payment details (Test Mode): UPI `success@razorpay` (success) or `failure@razorpay` (failure); card 4111 1111 1111 1111, any future expiry, any CVV, OTP from the test page.

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the GitHub repo, branch `main`.
2. Build settings: Framework preset **None**, build command `npm run build`, build output directory `out`. (Functions in `functions/` are picked up automatically.)
3. Add the settings above (Settings → Variables and Secrets), including the build variables. Redeploy after changing any.
4. **Custom domain**: the project → Custom domains → Set up a domain, then follow the DNS steps. Set `SITE_URL` to it and redeploy.
5. Firebase (Firestore only, free Spark plan): create the database (Native mode, `asia-south1`), publish `firestore.rules`, create the service-account key.

## Go-live checklist

- [ ] `npm run check:placeholders` prints nothing; the business details match the Razorpay account holder.
- [ ] Price, date and start time in `lib/offer.ts` match the ads.
- [ ] Custom https domain live; `SITE_URL` equals it exactly (as a secret and as a build variable).
- [ ] Live Razorpay keys set as Secrets; webhook added in Live Mode with the same secret.
- [ ] One real payment: thank-you page shows "confirmed", a row appears in `registrations`, the email arrives, paying again with the same email opens `/already-paid`; then refund it.
- [ ] A cancelled payment shows "Payment not completed"; `/thank-you?order_id=order_AAAAAAAAAAAAAA` never shows "confirmed".
- [ ] `curl -X POST https://your-domain.in/api/webhooks/razorpay` answers 401.
- [ ] Headers checked (securityheaders.com): CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy.
- [ ] Meta: Events Manager shows PageView, InitiateCheckout and Purchase (browser + server, deduplicated); domain verified.
- [ ] 2FA on Razorpay, Cloudflare, Firebase, the registrar and GitHub.

## Operations

- **Logs**: Cloudflare → the project → Functions → Real-time logs. Tags `[orders]`, `[callback]`, `[verify]`, `[webhook]`, `[buyers]`, `[meta-capi]`; order ids and error codes only.
- **Retries**: a 503 from the webhook makes Razorpay retry (for up to 24 hours).
- **Refunds**: from the Razorpay dashboard. The site never moves money.
- **After the webinar**: orders are refused 30 minutes after the start. Pause the ads too.
