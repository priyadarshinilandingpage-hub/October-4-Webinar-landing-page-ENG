# Priyadharsini Saffron Webinar: Landing Page and Registration

This is the website for the live webinar **"Start Small, Invest Smart, Build Wealth"** by Priyadharsini Subramaniam (in Tamil, Sunday 4 October 2026, 11:00 AM IST). Visitors read about the webinar, register for **₹99**, and pay through **Razorpay**. Once Razorpay confirms the payment, the buyer gets a button to join the private WhatsApp group where the joining link is shared.

The site is a standard Next.js application. It runs on any server that can run Node.js. No database or other service is needed: all settings go in one `.env` file, and no code changes are required to deploy it.

## Contents

1. [How it works](#how-it-works)
2. [Requirements](#requirements)
3. [Settings (`.env`)](#settings-env)
4. [Deployment](#deployment)
5. [Testing with Razorpay Test Mode](#testing-with-razorpay-test-mode)
6. [Going live](#going-live)
7. [Running the site](#running-the-site)
8. [Troubleshooting](#troubleshooting)
9. [Content to complete before going live](#content-to-complete-before-going-live)
10. [Technical reference](#technical-reference)

## How it works

1. A visitor fills in the registration form (name, email, WhatsApp number).
2. The server creates a Razorpay order for the fixed price of ₹99. The price is set on the server and cannot be changed from the browser.
3. Razorpay's secure checkout opens (UPI, cards, netbanking). After paying, the buyer is sent back to the site.
4. The server asks Razorpay directly whether the order is paid. The thank-you page then shows one of:
   - **Paid:** "Your seat is confirmed" and the **Join the WhatsApp group** button.
   - **Still processing:** "Confirming your payment…", checking again every few seconds.
   - **Failed or cancelled:** "Payment not completed", with a button to try again.
5. The site remembers each buyer's email and WhatsApp number. If the same email **or** number is used again, the site shows **"You have already paid for this webinar"** instead of charging a second time.

No emails are sent by the site. The WhatsApp group link is shown only to buyers whose payment Razorpay has confirmed.

## Requirements

- **Node.js 20.9 or newer** (22 LTS recommended), with npm.
- **A server that keeps a program running**: a Linux or Windows server, a VPS, or a hosting panel with Node.js support.
- **A domain with HTTPS** pointing to the server.
- **A Razorpay account**: Test Mode keys to set up, Live Mode keys to accept real payments.
- **The WhatsApp group invite link** for buyers.

## Settings (`.env`)

All settings live in a file named `.env` in the project folder, next to `package.json`. Create it by copying `.env.example`, which lists every setting with a short explanation. The `.env` file holds secrets: it is excluded from git and must never be shared or committed.

### Required

| Setting | Example | Where to get it |
|---|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_AbCdEf1234567890` | Razorpay Dashboard → Account & Settings → API Keys. Starts with `rzp_test_` in Test Mode and `rzp_live_` in Live Mode. |
| `RAZORPAY_KEY_SECRET` | *(secret)* | Shown once when the API key is generated. Keep it private. |
| `SITE_URL` | `https://your-domain.in` | The exact address visitors use, starting with `https://`. |
| `WEBINAR_WHATSAPP_URL` | `https://chat.whatsapp.com/...` | WhatsApp group → Invite via link. Shown only to confirmed buyers. |

### Recommended

| Setting | Purpose |
|---|---|
| `RAZORPAY_WEBHOOK_SECRET` | Any long password you choose. Enter the same value when adding the webhook in Razorpay (see [Deployment](#deployment), step 4). Payments are still confirmed without it, but the webhook adds a second, server-to-server confirmation. |

### Optional

| Setting | Purpose |
|---|---|
| `RAZORPAY_BRAND_NAME` | Name shown at the top of the Razorpay checkout. Razorpay requires it to match the account's business name or the website's domain. |
| `META_PIXEL_ID`, `META_CAPI_TOKEN`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_DOMAIN_VERIFICATION` | Meta (Facebook/Instagram) ads tracking: page views, checkouts and purchases. |
| `DATA_DIR` | Folder where the list of past buyers is kept. Default: `data/` in the project folder. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Only needed when running several copies of the site behind a load balancer. |
| `FIREBASE_*` | Not needed. Only for keeping an extra copy of registrations in Google Firestore. |

**When changes take effect:** after editing `.env`, restart the site. `SITE_URL`, `NEXT_PUBLIC_META_PIXEL_ID` and `META_DOMAIN_VERIFICATION` are also written into the pages, so after changing any of them, run `npm run build` before restarting.

## Deployment

Replace `your-domain.in` with the real domain throughout. Commands are shown for Linux. On Windows, run the same `npm` commands in PowerShell and create `.env` by copying `.env.example` in File Explorer.

### 1. Download the code and create the settings file

```bash
git clone https://github.com/priyadarshinilandingpage-hub/October-4-Webinar-landing-page.git webinar
cd webinar
cp .env.example .env
nano .env
```

Fill in the [required settings](#required) and `RAZORPAY_WEBHOOK_SECRET`. Start with **Test Mode** keys.

### 2. Build and start the site

```bash
npm ci
npm run build
npm install -g pm2
pm2 start npm --name webinar -- start
pm2 save
pm2 startup
```

- `npm ci` installs the exact package versions the site was tested with. Do not set `NODE_ENV=production` before this step, because the build needs the development packages.
- `pm2` keeps the site running and restarts it after a crash (on Linux, `npm install -g` may need `sudo`). `pm2 startup` prints one more command; run it so the site also starts after a server reboot. On Windows, where `pm2 startup` is not available, register `npm start` as a service (for example with NSSM) or use the hosting panel's startup setting.
- On a hosting panel with its own Node.js manager, set the start command to `npm start` and run `npm ci` and `npm run build` once from the panel's terminal.
- The site listens on port **3000**. To use another port: `pm2 start npm --name webinar -- start -- -p 8080`.

Then check the startup messages:

```bash
pm2 logs webinar --lines 20
```

A correct setup shows:

```
[startup] Site address: https://your-domain.in
[startup] Razorpay TEST mode: pretend payments only (no real money). Put the live keys in .env before running ads.
[startup] WhatsApp group link: set.
[startup] Razorpay webhook secret: set.
[startup] Already-paid list: saved in /home/.../webinar/data.
[startup] Razorpay keys: working. Payments are ready.
```

If a line reports a problem, see [Startup messages](#startup-messages).

### 3. Connect the domain and HTTPS

Point the domain (and `www.`) to the server, then put HTTPS in front of port 3000 using the web server already on the machine (nginx, Caddy, Apache or a hosting panel). Two points matter:

- Visitors must reach the site over `https://`. Plain `http://` should redirect to `https://`.
- The visitor's IP address should be passed to the site (`X-Real-IP` and `X-Forwarded-For` headers).

**Example: nginx on Ubuntu.** Create `/etc/nginx/sites-available/webinar`:

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

Enable it and add a free Let's Encrypt certificate:

```bash
sudo ln -s /etc/nginx/sites-available/webinar /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.in -d www.your-domain.in --redirect
```

**Example: Caddy.** Caddy obtains the certificate automatically. The complete `Caddyfile`:

```
your-domain.in, www.your-domain.in {
    reverse_proxy 127.0.0.1:3000
}
```

Both `your-domain.in` and `www.your-domain.in` work for buyers.

### 4. Configure Razorpay

In the Razorpay Dashboard, in the same mode (Test or Live) as the keys in `.env`:

1. **Webhook:** Account & Settings → Webhooks → Add New Webhook.
   - URL: `https://your-domain.in/api/webhooks/razorpay`
   - Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
   - Active events: `order.paid` and `payment.captured`
2. **Payment capture:** Account & Settings → Payment Capture → **Automatic**.

### 5. Run a test payment

Follow [Testing with Razorpay Test Mode](#testing-with-razorpay-test-mode). It takes about two minutes and uses no real money.

## Testing with Razorpay Test Mode

With Test Mode keys, Razorpay accepts pretend payment details:

| Method | Details | Result |
|---|---|---|
| UPI | `success@razorpay` | Payment succeeds |
| UPI | `failure@razorpay` | Payment fails |
| Card | `4111 1111 1111 1111`, any future expiry date, any CVV | Payment succeeds |

Check these three cases:

| Step | Expected result |
|---|---|
| 1. Fill in the form and pay with `success@razorpay`. | The thank-you page shows "Your seat is confirmed" and the green **Join the WhatsApp group** button. |
| 2. Fill in the form again with the **same email** (or the same WhatsApp number). | The site shows "You have already paid for this webinar." No second payment is started. |
| 3. Fill in the form with a new email and pay with `failure@razorpay`. | The page shows "Payment not completed" and no WhatsApp button. |

The test payments appear under Razorpay Dashboard → Test Mode → Orders. Test buyers never block real buyers later: the site keeps Test Mode and Live Mode buyers separate.

## Going live

1. Complete the [content required before going live](#content-to-complete-before-going-live).
2. In Razorpay, switch to **Live Mode**, generate live API keys, and put them in `.env` (`RAZORPAY_KEY_ID` now starts with `rzp_live_`).
3. Add the webhook again in Live Mode (webhooks are separate for each mode), with the same secret.
4. Make sure the domain is registered as the business website on the Razorpay account. Razorpay only accepts live payments from registered websites.
5. Restart: `pm2 restart webinar`. The log must show `Razorpay LIVE mode: real payments.` and `Razorpay keys: working. Payments are ready.`
6. Make one real ₹99 payment, confirm the WhatsApp button appears, then refund it from the Razorpay dashboard.

### Go-live checklist

- [ ] The Privacy Policy, Terms & Conditions and Refund & Cancellation pages have their text, and `npm run check:placeholders` reports nothing left to fill.
- [ ] The price, date and start time in `lib/offer.ts` match the ads.
- [ ] The site opens at `https://your-domain.in`, and `SITE_URL` matches it exactly.
- [ ] Live keys are in `.env`, and the webhook is added in Live Mode.
- [ ] The startup log shows `LIVE mode` and `Payments are ready`.
- [ ] One real payment shows the WhatsApp button, and paying again with the same email shows "You have already paid". The test payment is refunded.
- [ ] `curl -X POST https://your-domain.in/api/webhooks/razorpay` returns `401` (unsigned requests are refused).
- [ ] Two-factor authentication is on for Razorpay, the server, the domain registrar and GitHub.

## Running the site

| Task | Command or place |
|---|---|
| View logs | `pm2 logs webinar` |
| Restart after changing `.env` | `pm2 restart webinar` |
| Install an update | `git pull && npm ci && npm run build && pm2 restart webinar` |
| See buyers | Razorpay Dashboard → Orders. Each order's **Notes** hold the buyer's name, email and WhatsApp number. |
| Refund a payment | Razorpay Dashboard → Payments → select the payment → Refund. The site never moves money itself. |
| Uptime check | `https://your-domain.in/api/health` returns `{"ok":true}` |

**The `data/` folder.** The server creates `data/paid-contacts.json`, the list used to recognise returning buyers. It holds only one-way scrambled codes, never readable emails or phone numbers. Updates with `git pull` never touch it. Include it in server backups, and copy it along if the site moves to another folder or server.

**Duplicate payments.** If the same person manages to pay twice (for example, in two browser tabs at the same moment), their thank-you page shows a note, and the server log contains `[buyers] second paid order for the same buyer`. Refund the second payment from the Razorpay dashboard.

**After the webinar.** The site stops accepting registrations 30 minutes after the session starts. Pause the ads at the same time.

### Startup messages

Every start prints `[startup]` lines. They name settings only, never their values.

| Message | Meaning and action |
|---|---|
| `Razorpay keys: working. Payments are ready.` | Everything is set up. |
| `PAYMENTS ARE OFF. Fix these settings in .env, then restart: ...` | A required setting is missing or malformed. The form shows "Registration is temporarily unavailable" until it is fixed. |
| `Razorpay keys REJECTED` | The key id and secret don't match, contain spaces, or come from different modes (Test and Live). |
| `Couldn't reach Razorpay to test the keys` | The server can't reach the internet, or Razorpay is temporarily down. |
| `Razorpay TEST mode: pretend payments only` | Test keys are in use. Switch to live keys before running ads. |
| `WhatsApp group link MISSING` | Set `WEBINAR_WHATSAPP_URL`. Without it, buyers don't see the group button. |
| `Ignored because they look wrong (fix in .env): ...` | An optional setting is malformed and is being ignored. Payments keep working. |
| `Already-paid list: CAN'T WRITE to ...` | The site can't save files in that folder. Give it write access, or set `DATA_DIR` to a writable folder. |

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| The form says "Registration is temporarily unavailable". | A required setting is missing or wrong. Read the `[startup]` lines in the log. |
| The form says "Forbidden". | The address in the browser doesn't match `SITE_URL` (for example `http://` instead of `https://`, or another domain). Correct `SITE_URL`, run `npm run build`, and restart. |
| The build stops with "SITE_URL in .env must be a full address". | Write it as `https://your-domain.in`, including `https://`. |
| The build fails with missing packages. | Run `npm ci` without `NODE_ENV=production` set, then build again. |
| The thank-you page stays on "Confirming your payment…". | The bank is still processing the payment (common with UPI; the page keeps checking). If it never completes, set Razorpay → Payment Capture to **Automatic**. |
| Paid, but no WhatsApp button. | `WEBINAR_WHATSAPP_URL` is missing or malformed. See the `[startup]` lines. |
| "Too many attempts. Please wait a few minutes and try again." | More than 10 registration attempts from one visitor in 10 minutes. It clears by itself. |
| "Registrations for this session have closed." | The webinar started more than 30 minutes ago. To run a new session, update the date and time in `lib/offer.ts`, then build and restart. |
| The log says `visitor address missing, limits are off`. | The web server isn't passing the visitor's IP. Add the `X-Real-IP` and `X-Forwarded-For` headers (see the nginx example). The site keeps working in the meantime. |
| Razorpay rejects live payments because the website isn't registered. | Add the domain as the business website on the Razorpay account. |
| The Razorpay dashboard shows failed webhook deliveries. | The webhook secret in Razorpay must equal `RAZORPAY_WEBHOOK_SECRET`, and the URL must use `https://`. Payments are still confirmed by the thank-you page. |

## Content to complete before going live

These parts of the site hold business content, not settings:

- **Policy pages.** The Privacy Policy (`app/(legal)/privacy/page.tsx`), Terms & Conditions (`app/(legal)/terms/page.tsx`) and Refund & Cancellation (`app/(legal)/refund/page.tsx`) pages currently show their titles only. Razorpay reviews these pages before approving live payments. The privacy text should mention that the site uses Meta (Facebook) ads tracking if it is enabled, and that it remembers each buyer's email and WhatsApp number to prevent double payments.
- **Business details.** `lib/business.ts` holds the legal name, address, support email and phone, grievance officer and GSTIN shown on the Contact page. They must match the Razorpay account holder. `npm run check:placeholders` lists anything still unfilled.
- **Webinar details.** `lib/offer.ts` holds the title, price, date and start time. Page text is in `components/content.ts`.

After editing any of these files, run `npm run build` and restart.

## Technical reference

### Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, zod for validation, sharp for build-time image sizes, and Vitest for tests. Every page is pre-built at `npm run build` and served as a static file; only the `/api/*` routes run code on each request.

### Project structure

```
app/                    Pages: landing (/ and /dark), /thank-you, /already-paid, policy pages
app/api/                Payment endpoints (thin wrappers around server/routes)
components/             Page sections and UI; page text in components/content.ts
lib/offer.ts            Webinar title, price, date and time (single source of truth)
lib/business.ts         Business details for the Contact and policy pages
server/                 Payment logic: Razorpay client, route handlers, settings, startup check
public/media/           Images and videos
scripts/                Build helpers: image sizes and safety checks
test/                   Automated tests
instrumentation.ts      Runs the startup check when the server starts
data/                   Created at runtime: the already-paid list (not in git)
functions/              Optional Cloudflare Pages adapter, not used on a Node.js server
```

### API endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/orders` | Validates the form, refuses returning buyers, creates the fixed-price Razorpay order. |
| `POST /api/razorpay/callback` | Where Razorpay returns the buyer. Checks the payment signature, records the buyer, redirects to `/thank-you`. |
| `GET /api/verify?order_id=...` | Used by the thank-you page. Asks Razorpay for the order status; returns the WhatsApp link only for a paid order. |
| `POST /api/webhooks/razorpay` | Razorpay's signed server-to-server notice. Re-checks the order with Razorpay and records the buyer. |
| `GET /api/health` | Uptime check. |

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server at `http://localhost:3000` |
| `npm run build` | Production build. Also checks `.env` for exposed secrets and a malformed `SITE_URL`, creates image sizes, and scans the browser files for secrets. |
| `npm start` | Production server, with the startup check |
| `npm test` | Automated tests for orders, payment confirmation, webhooks, the already-paid list and settings |
| `npm run typecheck` | TypeScript check |
| `npm run check:placeholders` | Lists business details still to fill (values in `[SQUARE BRACKETS]`) and open notes in `lib/offer.ts` |

To try payments on your own computer, put Test Mode keys in `.env` with `SITE_URL=http://localhost:3000`, then run `npm run build` and `npm start`. Everything works except the webhook, which Razorpay can't deliver to a local computer; the thank-you page confirms payments on its own.

### Security

- **Fixed price.** The browser sends only the buyer's details. The amount (₹99, 9900 paise) is set on the server, and any other field is rejected.
- **Payment status comes only from Razorpay.** Status must be `paid`, for exactly 9900 paise, in INR. Nothing in the page address is trusted.
- **Signatures.** Payment and webhook signatures (HMAC-SHA256) are verified with constant-time comparison.
- **Secrets stay on the server.** The Razorpay key secret never reaches the browser; every build scans the browser files for it.
- **Request checks.** Registration requests are accepted only from the site itself (with or without `www.`). They are limited in size and rate (10 per visitor per 10 minutes), and protected against bots with a hidden field and a minimum fill time.
- **Safe redirects.** Redirects are built only from `SITE_URL`.
- **Security headers.** Content Security Policy, HSTS, frame blocking, nosniff, and referrer and permissions policies (`next.config.ts`).
- **No personal data in logs.** Logs contain order ids and error codes only, never names, emails or phone numbers.
