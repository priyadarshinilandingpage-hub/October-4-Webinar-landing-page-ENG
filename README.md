# Priyadharsini · Saffron: webinar landing page

A Next.js 16 landing page that sells a ₹99 live webinar (Sunday 4 October 2026) through Razorpay. It runs on any server with Node.js: the pages are pre-built files, and only the payment steps run code.

## Architecture

- **Pages** (`app/`): pre-built at `npm run build` and served by `npm start` as files (no work per visit).
  - The page carries both ads' headlines; `public/boot.js` (a tiny blocking script in `<head>`) picks ad B for `utm_content=creative_b` and applies `?theme=` / the saved theme cookie before the first paint.
  - Images: `scripts/make-images.mjs` writes WebP copies of `public/media` images at 7 widths into `public/_img/` at build time; `lib/image-loader.ts` points `next/image` at them.
- **Payment steps** (`app/api/*`, logic in `server/routes/*`, web-standard code: fetch + Web Crypto):
  | Endpoint | Does |
  |---|---|
  | `POST /api/orders` | Validates the form, blocks repeat buyers, creates the Razorpay order for the fixed ₹99 (logic in `server/routes/orders.ts`) |
  | `POST/GET /api/razorpay/callback` | Where Razorpay returns the buyer (redirect mode). Verifies the signature, starts the follow-up, sends them to `/thank-you` |
  | `GET /api/verify?order_id=` | The thank-you page's check: asks Razorpay; only a verified PAID order gets the WhatsApp link |
  | `POST /api/webhooks/razorpay` | Razorpay's signed server notice. Re-reads the order, runs the follow-up and Meta CAPI |
  | `GET /api/health` | Uptime check |
- **Security headers** (CSP, HSTS, frame blocking, nosniff, referrer and permissions policies) and the `/bold` redirect are in `next.config.ts`.
- `functions/` is an optional Cloudflare Pages adapter for the same logic; the Node server doesn't use it.

## Run it on a server (step by step)

No code changes are needed: everything the site needs goes in the `.env` file. Commands are for Ubuntu with nginx; replace `your-domain.in` with the real domain everywhere. Requirements: Node.js **20.9 or newer** (22 LTS recommended), git, nginx, and the domain's DNS pointing at the server (both `your-domain.in` and `www.your-domain.in`).

**1. Get the code and fill in the settings**

```bash
git clone https://github.com/priyadarshinilandingpage-hub/October-4-Webinar-landing-page.git webinar
cd webinar
cp .env.example .env
nano .env
```

Fill in at least these five (details in "Settings" below):

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
SITE_URL=https://your-domain.in
WEBINAR_WHATSAPP_URL=https://chat.whatsapp.com/...
RAZORPAY_WEBHOOK_SECRET=any-long-password-you-make-up
```

**2. Build and start, and keep it running**

```bash
npm ci
npm run build
sudo npm install -g pm2
pm2 start npm --name webinar -- start
pm2 save
pm2 startup      # prints one command: run it, so the site starts again after a reboot
pm2 logs webinar --lines 20
```

The log must show `[startup] Razorpay keys: working. Payments are ready.` If it says `PAYMENTS ARE OFF` or `keys REJECTED`, it names the setting to fix in `.env`; fix it and run `pm2 restart webinar`.

**3. nginx and HTTPS.** Create `/etc/nginx/sites-available/webinar` with:

```nginx
server {
    listen 80;
    server_name your-domain.in www.your-domain.in;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/webinar /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.in -d www.your-domain.in --redirect
```

Certbot adds the certificate and sends http visitors to https. Both `your-domain.in` and `www.your-domain.in` work.

**4. Razorpay dashboard** (in the same mode as the keys): Webhooks → Add: URL `https://your-domain.in/api/webhooks/razorpay`, the same secret as `RAZORPAY_WEBHOOK_SECRET`, events **order.paid** and **payment.captured**. Account & Settings → Payment capture → **Automatic**.

**5. One test payment (Test Mode keys, no real money, about 2 minutes)**

1. Open the site, fill the form, pay by UPI with `success@razorpay`: the thank-you page shows "Your seat is confirmed" and the green WhatsApp button.
2. Fill the form again with the same email: it shows "You have already paid for this webinar."
3. Fill it with a new email and pay with `failure@razorpay`: it shows "Payment not completed".

**6. Go live:** Razorpay Live Mode → generate live keys, put them in `.env` (`rzp_live_...`), add the webhook again in Live Mode, then `pm2 restart webinar`. Razorpay only takes live payments on the website registered on the account, so check that `your-domain.in` is listed there (Account & Settings → business website details). The log then says `Razorpay LIVE mode`. Pay ₹99 once yourself and refund it from the dashboard.

**Good to know**
- **Update after code changes**: `git pull && npm ci && npm run build && pm2 restart webinar`.
- **After changing `.env`**: `pm2 restart webinar`. If you changed `SITE_URL`, `NEXT_PUBLIC_META_PIXEL_ID` or `META_DOMAIN_VERIFICATION`, run `npm run build` first.
- **The `data/` folder** holds the already-paid list (scrambled codes only, no emails or numbers). `git pull` never touches it. If you move the site to a new folder, copy `data/` along.
- **Logs**: `pm2 logs webinar`.

| Script | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | `prebuild` (blocks secret-looking `NEXT_PUBLIC_*` vars and a malformed `SITE_URL`, makes image copies), `next build`, `postbuild` (scans browser files for secrets) |
| `npm start` | Production server. Prints a `[startup]` check: settings, Razorpay keys, WhatsApp link, already-paid list |
| `npm test` | Order creation, callback, verification, webhook signatures, Firestore follow-up, Meta CAPI, validation |
| `npm run check:placeholders` | Lists every `[PLACEHOLDER]` still on the policy pages. Must print nothing before go-live |

## Settings (`.env`)

`.env.example` has the full list with comments. `.env` is never committed (it's in `.gitignore`).

| Variable | Required | Secret | Purpose |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | yes | no (public) | `rzp_test_…` until go-live, then `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | yes | **yes** | Razorpay key secret. Also verifies the checkout signature |
| `RAZORPAY_WEBHOOK_SECRET` | recommended | **yes** | The secret you type when adding the webhook in Razorpay (payments are confirmed without it too) |
| `RAZORPAY_BRAND_NAME` | no | no | Name at the top of the checkout (must match the Razorpay account's business name or the site's domain) |
| `SITE_URL` | yes | no | `https://your-domain.in`, exactly as in the browser. Used at build time too |
| `WEBINAR_WHATSAPP_URL` | **yes** | keep private | Buyers-only WhatsApp group invite link. Shown only on the verified thank-you page |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | no | key **yes** | Optional Firestore `registrations` table of buyers + already-paid list (service-account key; free Spark plan). Without it the already-paid list is kept in `data/` and buyers are in the Razorpay dashboard |
| `DATA_DIR` | no | no | Folder for the already-paid list when Firestore isn't set up. Default: `data/` next to `package.json` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | no | token **yes** | Rate limits shared by several server processes |
| `META_PIXEL_ID` / `META_CAPI_TOKEN` | for ads | token **yes** | Server-side Meta "Purchase" for every verified buyer |
| `NEXT_PUBLIC_META_PIXEL_ID` | for ads | no (public) | Build value: the browser Pixel, and opens the CSP for Meta |
| `META_DOMAIN_VERIFICATION` | no | no | Build value: Meta domain verification meta tag |

## After a payment

Once Razorpay says an order is PAID for exactly 9900 paise INR, the thank-you page shows the **WhatsApp group button** (from `WEBINAR_WHATSAPP_URL`; no email is sent), and `server/fulfil.ts` runs two steps (from the callback, the thank-you check and the webhook; each is safe to repeat, and a failure in one doesn't stop the other):
1. **Already-paid list**: email and WhatsApp number saved as hashes, in Firestore `paid_contacts` or, without Firestore, in `data/paid-contacts.json`. A later form submit with the same email **or** number opens `/already-paid` instead of a second payment. Names are not matched.
2. **Registrations table** (only with Firestore): one Firestore document per order in `registrations` (`order_id, name, email, phone, amount, currency, status, mode, webinar_date, confirmed_at, marketing_consent, utm_source, utm_campaign, utm_content, duplicate_of`). As a table: Firebase console → Firestore → **Query builder**. Every payment is also in the Razorpay dashboard (the buyer's details are in each order's notes).

`duplicate_of` marks a second paid order by the same person: refund it from the Razorpay dashboard. Publish `firestore.rules` (denies all browser access).

## How payments are kept safe

1. The browser sends only name, email, WhatsApp number and consent; the schema is `.strict()`, so an `amount` is rejected. The server hard-codes **9900 paise INR** from `lib/offer.ts`.
2. Order creation checks the Origin (same site; `www.` or not), content type, body size (4 KB), rate limit (10 per IP per 10 minutes; off when a proxy hides the visitor's address, so buyers never block each other), validation, a honeypot and time-to-fill. Sales stop 30 minutes after the session starts.
3. The browser gets back only public checkout details. The key secret never leaves the server; `postbuild` scans the browser files for it.
4. "Paid" is only decided by asking Razorpay (`GET /v1/orders/{id}`: status `paid`, amount and amount paid 9900, INR). The address bar is never trusted.
5. Checkout and webhook signatures (HMAC-SHA256) are checked with constant-time compares; webhooks are re-checked against the API.
6. Redirects are built only from `SITE_URL`. Logs hold order ids and error codes, never names, emails or phone numbers.

## Razorpay setup

1. **Test mode first**: Dashboard → **Test Mode** → Account & Settings → **API Keys** → Generate. Put both in `.env`. Webhook and payment capture: step 4 of "Run it on a server".
2. **Website review**: the live site must show the price, Privacy Policy, Terms, Refund & Cancellation, and a Contact page whose name matches the account holder. The Privacy, Terms and Refund pages are **empty on purpose** (only their titles): the client writes them in `app/(legal)/privacy|terms|refund/page.tsx`. Fill every placeholder too (`npm run check:placeholders`).
3. **Go live**: step 6 of "Run it on a server".

Test Mode payments: UPI `success@razorpay` (success) or `failure@razorpay` (failure); card 4111 1111 1111 1111, any future expiry, any CVV.

## Go-live checklist

- [ ] `npm run check:placeholders` prints nothing; the business details match the Razorpay account holder.
- [ ] Price, date and start time in `lib/offer.ts` match the ads.
- [ ] HTTPS works and `SITE_URL` equals the address exactly (then `npm run build` again).
- [ ] Live keys in `.env`; webhook added in Live Mode with the same secret.
- [ ] `pm2 logs webinar` shows `Razorpay LIVE mode` and `Razorpay keys: working`.
- [ ] One real payment: "confirmed" and the WhatsApp button on the thank-you page, a row in `registrations` (only with Firestore), paying again with the same email opens `/already-paid`; then refund it.
- [ ] `curl -X POST https://your-domain.in/api/webhooks/razorpay` answers 401.
- [ ] Headers checked (securityheaders.com): CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy.
- [ ] Meta Events Manager shows PageView, InitiateCheckout and Purchase (browser + server, deduplicated).
- [ ] 2FA on Razorpay, the server, Firebase, the domain registrar and GitHub.

## Operations

- **Logs**: `pm2 logs webinar`. Tags `[startup]`, `[config]`, `[orders]`, `[callback]`, `[verify]`, `[webhook]`, `[buyers]`, `[meta-capi]`; order ids and error codes only.
- **Retries**: a 503 from the webhook makes Razorpay retry (for up to 24 hours).
- **Refunds**: from the Razorpay dashboard. The site never moves money.
- **After the webinar**: orders are refused 30 minutes after the start. Pause the ads too.
