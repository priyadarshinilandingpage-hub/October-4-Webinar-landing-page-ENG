# Priyadharsini · Saffron: webinar landing page

A Next.js 16 landing page that sells a ₹99 live webinar (Sunday 4 October 2026) through Razorpay. It runs on any server with Node.js: the pages are pre-built files, and only the payment steps run code.

## Architecture

- **Pages** (`app/`): pre-built at `npm run build` and served by `npm start` as files (no work per visit).
  - The page carries both ads' headlines; `public/boot.js` (a tiny blocking script in `<head>`) picks ad B for `utm_content=creative_b` and applies `?theme=` / the saved theme cookie before the first paint.
  - Images: `scripts/make-images.mjs` writes WebP copies of `public/media` images at 7 widths into `public/_img/` at build time; `lib/image-loader.ts` points `next/image` at them.
- **Payment steps** (`app/api/*`, logic in `server/routes/*`, web-standard code: fetch + Web Crypto):
  | Endpoint | Does |
  |---|---|
  | `POST /api/orders` | Validates the form, blocks repeat buyers, creates the Razorpay order for the fixed ₹99. **The route file `app/api/orders/route.ts` still has to be added** (see HANDOFF §6); the logic is `server/routes/orders.ts` |
  | `POST/GET /api/razorpay/callback` | Where Razorpay returns the buyer (redirect mode). Verifies the signature, starts the follow-up, sends them to `/thank-you` |
  | `GET /api/verify?order_id=` | The thank-you page's check: asks Razorpay; only a verified PAID order gets the WhatsApp link |
  | `POST /api/webhooks/razorpay` | Razorpay's signed server notice. Re-reads the order, runs the follow-up and Meta CAPI |
  | `GET /api/health` | Uptime check |
- **Security headers** (CSP, HSTS, frame blocking, nosniff, referrer and permissions policies) and the `/bold` redirect are in `next.config.ts`.
- `functions/` is an optional Cloudflare Pages adapter for the same logic; the Node server doesn't use it.

## Run it on a server

Requirements: Node.js **20.9 or newer** (22 LTS recommended) and git.

```bash
git clone https://github.com/priyadarshinilandingpage-hub/October-4-Webinar-landing-page.git webinar
cd webinar
cp .env.example .env      # then fill in the Razorpay keys and SITE_URL (see "Settings")
npm ci
npm run build
npm start                 # http://localhost:3000   (another port: npm start -- -p 8080)
```

- **Keep it running** (restarts after a crash or reboot): `npm install -g pm2`, then `pm2 start npm --name webinar -- start`, `pm2 save`, `pm2 startup`.
- **HTTPS**: put nginx (or Caddy) in front with a Let's Encrypt certificate, proxying to `http://127.0.0.1:3000`. Pass the visitor's address so rate limits work: `proxy_set_header X-Real-IP $remote_addr;` and `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`.
- **Update after changes**: `git pull && npm ci && npm run build && pm2 restart webinar`.
- After changing `.env`: restart (`pm2 restart webinar`). Build values (`SITE_URL`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_DOMAIN_VERIFICATION`) also need `npm run build`.

| Script | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | `prebuild` (blocks secret-looking `NEXT_PUBLIC_*` vars, makes image copies), `next build`, `postbuild` (scans browser files for secrets) |
| `npm start` | Production server |
| `npm test` | Order creation, callback, verification, webhook signatures, Firestore + Resend follow-up, Meta CAPI, validation |
| `npm run check:placeholders` | Lists every `[PLACEHOLDER]` still on the policy pages. Must print nothing before go-live |

## Settings (`.env`)

`.env.example` has the full list with comments. `.env` is never committed (it's in `.gitignore`).

| Variable | Required | Secret | Purpose |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | yes | no (public) | `rzp_test_…` until go-live, then `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | yes | **yes** | Razorpay key secret. Also verifies the checkout signature |
| `RAZORPAY_WEBHOOK_SECRET` | yes | **yes** | The secret you type when adding the webhook in Razorpay |
| `RAZORPAY_BRAND_NAME` | no | no | Name at the top of the checkout (must match the Razorpay account's business name or the site's domain) |
| `SITE_URL` | yes | no | `https://your-domain.in`, exactly as in the browser. Used at build time too |
| `WEBINAR_WHATSAPP_URL` | recommended | keep private | Buyers-only WhatsApp group: verified thank-you page and confirmation email only |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | recommended | key **yes** | Firestore `registrations` table + already-paid list (service-account key; the free Spark plan is enough) |
| `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_REPLY_TO` | recommended | key **yes** | Seat-confirmation email |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | no | token **yes** | Rate limits shared by several server processes |
| `META_PIXEL_ID` / `META_CAPI_TOKEN` | for ads | token **yes** | Server-side Meta "Purchase" for every verified buyer |
| `NEXT_PUBLIC_META_PIXEL_ID` | for ads | no (public) | Build value: the browser Pixel, and opens the CSP for Meta |
| `META_DOMAIN_VERIFICATION` | no | no | Build value: Meta domain verification meta tag |

## After a payment

Once Razorpay says an order is PAID for exactly 9900 paise INR, `server/fulfil.ts` runs three steps (from the callback, the thank-you check and the webhook; each is safe to repeat, and a failure in one doesn't stop the others):
1. **Already-paid list**: email and WhatsApp number saved as hashes in Firestore `paid_contacts`. A later form submit with the same email **or** number opens `/already-paid` instead of a second payment. Names are not matched.
2. **Registrations table**: one Firestore document per order in `registrations` (`order_id, name, email, phone, amount, currency, status, mode, webinar_date, confirmed_at, marketing_consent, utm_source, utm_campaign, utm_content, duplicate_of, email_status, email_sent_at`). As a table: Firebase console → Firestore → **Query builder**. Every payment is also in the Razorpay dashboard (the buyer's details are in each order's notes).
3. **Confirmation email** through Resend with the WhatsApp button and a calendar link, once per order.

`duplicate_of` marks a second paid order by the same person: refund it from the Razorpay dashboard. Publish `firestore.rules` (denies all browser access).

## How payments are kept safe

1. The browser sends only name, email, WhatsApp number and consent; the schema is `.strict()`, so an `amount` is rejected. The server hard-codes **9900 paise INR** from `lib/offer.ts`.
2. Order creation checks the Origin (same-origin only), content type, body size (4 KB), rate limit (10 per IP per 10 minutes), validation, a honeypot and time-to-fill. Sales stop 30 minutes after the session starts.
3. The browser gets back only public checkout details. The key secret never leaves the server; `postbuild` scans the browser files for it.
4. "Paid" is only decided by asking Razorpay (`GET /v1/orders/{id}`: status `paid`, amount and amount paid 9900, INR). The address bar is never trusted.
5. Checkout and webhook signatures (HMAC-SHA256) are checked with constant-time compares; webhooks are re-checked against the API.
6. Redirects are built only from `SITE_URL`. Logs hold order ids and error codes, never names, emails or phone numbers.

## Razorpay setup

1. **Test mode first**: Dashboard → **Test Mode** → Account & Settings → **API Keys** → Generate. Put both in `.env`.
2. **Webhook**: Account & Settings → **Webhooks** → Add: URL `https://<your-domain>/api/webhooks/razorpay`, a secret you make up (same value in `RAZORPAY_WEBHOOK_SECRET`), events **order.paid** and **payment.captured**.
3. **Payment capture**: Account & Settings → Payment capture → **Automatic**.
4. **Website review**: the live site must show the price, Privacy Policy, Terms, Refund & Cancellation, and a Contact page whose name matches the account holder. Fill every placeholder first (`npm run check:placeholders`).
5. **Go live**: Live Mode → generate **live** keys, replace both in `.env`, add the webhook again in Live Mode, restart. Pay ₹99 once yourself and refund it.

Test Mode payments: UPI `success@razorpay` (success) or `failure@razorpay` (failure); card 4111 1111 1111 1111, any future expiry, any CVV.

## Go-live checklist

- [ ] `npm run check:placeholders` prints nothing; the business details match the Razorpay account holder.
- [ ] Price, date and start time in `lib/offer.ts` match the ads.
- [ ] HTTPS works and `SITE_URL` equals the address exactly (then `npm run build` again).
- [ ] Live keys in `.env`; webhook added in Live Mode with the same secret.
- [ ] One real payment: "confirmed" on the thank-you page, a row in `registrations`, the email arrives, paying again with the same email opens `/already-paid`; then refund it.
- [ ] `curl -X POST https://your-domain.in/api/webhooks/razorpay` answers 401.
- [ ] Headers checked (securityheaders.com): CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy.
- [ ] Meta Events Manager shows PageView, InitiateCheckout and Purchase (browser + server, deduplicated).
- [ ] 2FA on Razorpay, the server, Firebase, the domain registrar and GitHub.

## Operations

- **Logs**: `pm2 logs webinar`. Tags `[orders]`, `[callback]`, `[verify]`, `[webhook]`, `[buyers]`, `[meta-capi]`; order ids and error codes only.
- **Retries**: a 503 from the webhook makes Razorpay retry (for up to 24 hours).
- **Refunds**: from the Razorpay dashboard. The site never moves money.
- **After the webinar**: orders are refused 30 minutes after the start. Pause the ads too.
