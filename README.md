# Priyadharsini · Saffron: webinar landing page

A Next.js 16 (App Router) landing page that sells a ₹99 live webinar (Sunday 4 October 2026) through the Cashfree Payment Gateway. It deploys to Vercel, Render or Firebase App Hosting.

## Local development

Requirements: Node.js 20.9 or newer (24 LTS recommended).

```bash
npm ci
cp .env.example .env.local      # then fill in the Cashfree SANDBOX keys
npm run dev                     # http://localhost:3000
```

For `npm run dev`, set `SITE_URL=http://localhost:3000`. Cashfree only accepts an https webhook URL, so on localhost the app leaves `notify_url` out. Payments still work, and `/thank-you` checks the status with Cashfree directly. To test webhooks locally, expose the dev server over an https tunnel (for example `cloudflared tunnel --url http://localhost:3000`) and set `SITE_URL` to the tunnel URL.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Runs `prebuild` (blocks secret-looking `NEXT_PUBLIC_*` vars), then `next build`, then `postbuild` (scans the browser bundles for server secrets) |
| `npm start` | Production server. Listens on `$PORT` (default 3000) on `0.0.0.0`, which works on Render and Linux |
| `npm test` | Unit tests (vitest): webhook signatures, validation, order verification, the API routes, Meta CAPI |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:placeholders` | Lists every `[PLACEHOLDER]` still on the policy pages. Must print nothing before go-live |

## Environment variables

`.env.example` has the full list, with comments. Secret values belong only in the hosting platform's env or secret manager, never in git and never under a `NEXT_PUBLIC_` name.

| Variable | Required | Secret | Purpose |
|---|---|---|---|
| `CASHFREE_CLIENT_ID` | yes | **yes** | Cashfree App ID (Dashboard → Developers → API Keys) |
| `CASHFREE_CLIENT_SECRET` | yes | **yes** | Cashfree secret key. Also used to verify webhook signatures |
| `CASHFREE_ENV` | yes | no | `sandbox` or `production`. The app refuses to start if a test secret is used in production, or the other way round |
| `CASHFREE_API_VERSION` | no | no | Defaults to `2025-01-01` |
| `SITE_URL` | yes | no | The public origin, e.g. `https://your-domain.in`. Every return and webhook URL and the same-origin check are built from it. It must be **exactly** the address in the browser, and https in production |
| `WEBINAR_WHATSAPP_URL` | recommended | keep private | Buyers-only WhatsApp group. Shown on the verified thank-you page and in the confirmation email |
| `FIREBASE_PROJECT_ID` | on Vercel / Render | no | Turns on the Firestore `registrations` table and the shared already-paid list. Not needed on Firebase App Hosting: the project is read from the `FIREBASE_CONFIG` variable App Hosting sets. Without Firestore, the already-paid list is per server instance and forgotten on restart |
| `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | on Vercel / Render | key **yes** | A service account key (Firebase console → Project settings → Service accounts → Generate new private key). Paste `client_email` and `private_key` from the JSON. Not needed on App Hosting: the backend's own service account is used |
| `RESEND_API_KEY` | recommended | **yes** | Resend API key (`re_…`) for the seat-confirmation email |
| `EMAIL_FROM` | with Resend | no | Sender on a domain verified in Resend, e.g. `Priyadharsini Webinar <webinar@your-domain.in>` |
| `EMAIL_REPLY_TO` | no | no | Where replies to the confirmation email go |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | recommended | token **yes** | Shared rate limiting across instances. Without them, each server instance counts separately |
| `META_PIXEL_ID` / `META_CAPI_TOKEN` | recommended for ads | token **yes** | Server-side Meta Conversions API "Purchase", sent for every verified buyer |
| `META_TEST_EVENT_CODE` | no | no | Meta Events Manager test code, while testing |
| `NEXT_PUBLIC_META_PIXEL_ID` | recommended for ads | no (public) | The browser Pixel (PageView, InitiateCheckout, Purchase). Also opens the CSP to Meta's hosts. Set it at **build** time |
| `META_DOMAIN_VERIFICATION` | no | no | Business Manager domain verification code (meta-tag method), added to every page's `<head>` |

## After a payment

Once Cashfree says an order is PAID (checked on the server by the webhook and by `/thank-you`), `lib/fulfil.ts` runs three steps. Each one is safe to repeat:
1. **Already-paid list.** The buyer's email and WhatsApp number are saved (as hashes, in the Firestore collection `paid_contacts`). A later form submit with the same email **or** number gets `409 { alreadyPaid: true }`, and the browser opens `/already-paid` instead of a second payment. Names are not matched, because different people share names.
2. **Registrations table.** One Firestore document per order in `registrations`, one field per column: `order_id, name, email, phone, amount, currency, status, mode, webinar_date, confirmed_at, marketing_consent, utm_source, utm_campaign, utm_content, duplicate_of, email_status, email_sent_at`. To see it as a table: Firebase console → Firestore → **Query builder** → collection `registrations`. `duplicate_of` is filled when the same person paid twice in parallel: refund that order from the Cashfree dashboard.
3. **Confirmation email** through Resend, with the WhatsApp group button and a calendar link. Sent once per order (Resend idempotency key plus `email_status`).

If a step fails in the webhook, it answers 503 and Cashfree retries later. Keep `firestore.rules` (deny all browser access) deployed: the server uses its service account and doesn't need rules.

## How payments are kept safe

1. The browser sends only name, email, WhatsApp number and consent to `POST /api/orders`. It never sends a price: the schema is `.strict()`, so an `amount` field is rejected.
2. The server checks the Origin (same-origin only), the content type and body size (4 KB), the rate limit (10 per IP per 10 minutes), the zod validation, and a honeypot plus time-to-fill check. It then creates the Cashfree order with the **hard-coded ₹99.00 INR** from `lib/offer.ts`, a random order id, a UUID idempotency key, and return and webhook URLs built from `SITE_URL`. Order sales stop 30 minutes after the session starts.
3. The browser gets back only `paymentSessionId` and `mode`, then opens Cashfree's official checkout (`@cashfreepayments/cashfree-js`, `redirectTarget: "_self"`).
4. `/thank-you?order_id=…` asks Cashfree on the server (`GET /pg/orders/{id}`). The page says "paid" only when the status is `PAID` **and** the amount is exactly 99.00 **and** the currency is INR. The URL is never trusted.
5. `POST /api/webhooks/cashfree` verifies `base64(HMAC-SHA256(timestamp + rawBody, secret))` on the raw bytes with a constant-time compare. It rejects timestamps older than 1 hour and handles each payload only once. For payment success it re-reads the order from Cashfree before acting.
6. Keys live only in server env vars. Every module that uses them has `import "server-only"`, and the build scans client bundles for leaks.
7. Security headers are set in `proxy.ts`: a nonce-based CSP with `'strict-dynamic'` (Cashfree hosts allowed), HSTS, `frame-ancestors 'none'` and `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and COOP. `X-Powered-By` is off. API routes get their headers from `next.config.ts`.
8. Logs contain order ids and error codes only, never names, emails or phone numbers. The browser only ever sees generic error messages.

## Cashfree setup

1. **Sandbox first.** In the Cashfree Merchant Dashboard, switch to **Test mode**, then go to Developers → API Keys and copy the test App ID and Secret Key. Set `CASHFREE_ENV=sandbox`. Pay with Cashfree's test cards or test UPI IDs (see Cashfree's "Test data" docs).
2. **Webhooks.** Every order already carries `notify_url = SITE_URL/api/webhooks/cashfree`, so nothing else is needed on an https domain. You can optionally add the same URL under **Developers → Webhooks** (Payment events, version `2025-01-01`) to control the retry policy. Duplicates are handled. If the Cashfree account is also used for other products, those webhooks are ignored: only our `wb_…` order ids are processed.
3. **Custom domain.** Cashfree production only works on a **whitelisted https domain**, and the `*.vercel.app`, `*.onrender.com` and `*.hosted.app` domains may be rejected. Buy the domain early, connect it to the host, and redirect `www` to the apex (or the other way round) so there is only one origin. Then set `SITE_URL` to it.
4. **Website review / KYC.** Cashfree checks the live site for the price, Privacy Policy, Terms, Refund & Cancellation Policy, and a Contact page with a business address. Fill every placeholder first (`npm run check:placeholders`).
5. **Go to production.** Once the account is activated and the domain is whitelisted (Dashboard → Developers → Whitelisting), create **production** API keys, set `CASHFREE_CLIENT_ID`, `CASHFREE_CLIENT_SECRET` and `CASHFREE_ENV=production`, and redeploy. Make one real ₹99 payment and refund it from the dashboard.

## Deploy

All three hosts run the same code. Set the env vars **before** the first production build.

### Vercel
1. Import the repo in Vercel (framework: Next.js, default build command).
2. Under Settings → Environment Variables, add the variables above for **Production** (and use sandbox values for Preview if you want). Mark secrets as *Sensitive*.
3. Add your custom domain and set `SITE_URL` to it. `vercel.json` pins functions to Mumbai (`bom1`), close to Cashfree and to buyers.
4. Preview deployments run on a different origin, so the order API returns 403 there unless `SITE_URL` matches. That is expected.

### Render
1. New → **Blueprint**, then pick the repo. `render.yaml` creates a Node web service (build `npm ci && npm run build`, start `npm start`, health check `/api/health`, Singapore region).
2. Render prompts for every `sync: false` variable. Paste the values there.
3. Add the custom domain under Settings → Custom Domains, then set `SITE_URL` to it.
4. Don't set `NODE_ENV` yourself: `npm ci` would then skip the build tools. Use a paid instance for ad traffic, because free instances sleep.

### Firebase App Hosting
1. Firebase console: create the project and switch it to the **Blaze** plan (set a budget alert).
2. **Firestore:** Build → Firestore Database → Create database → Native mode, location `asia-south1` (Mumbai), production mode. Then Rules → paste `firestore.rules` → Publish.
3. **App Hosting:** Build → App Hosting → Get started → connect GitHub and pick the repo, branch `main`, root directory `/`, region `asia-southeast1` (Singapore, the closest to India; there is no Mumbai option). Automatic rollouts: on. The first rollout works without any secrets (the ₹99 form says registration is unavailable until step 5).
4. Put the backend's `https://…hosted.app` address (later the custom domain) in `SITE_URL` in `apphosting.yaml`, and push.
5. When you have the keys, create the secrets and uncomment their blocks in `apphosting.yaml` (the file has the exact commands). Install the CLI with `npm install -g firebase-tools`, then `firebase login`.
6. Connect the custom domain (App Hosting → the backend → Settings → Domains) and add the DNS records it shows at your registrar. Set `minInstances: 1` while ads run.

## Go-live security checklist

- [ ] `npm run check:placeholders` prints nothing. The business name, address, email, phone and grievance officer are all real and match the Cashfree KYC.
- [ ] Price, date and start time in `lib/offer.ts` match the ads (₹99, Sunday 4 October 2026, confirmed time).
- [ ] The custom https domain is live, whitelisted in Cashfree, and `SITE_URL` equals it exactly (with no second `www` or apex origin serving the site).
- [ ] `CASHFREE_ENV=production` with **production** keys, set only in the host's secret store. No `NEXT_PUBLIC_*` secrets. Keys are not in git (`git log -p | grep -i cfsk_` finds nothing).
- [ ] One end-to-end real payment: the thank-you page shows "confirmed", the webhook logs `payment confirmed`, and the refund from the dashboard works.
- [ ] A failed or cancelled payment shows "Payment not completed". Refreshing `/thank-you` with a random `order_id` never shows "confirmed".
- [ ] The webhook endpoint answers 401 to an unsigned POST: `curl -X POST https://your-domain.in/api/webhooks/cashfree`.
- [ ] Response headers checked (for example securityheaders.com): CSP with nonce, HSTS, X-Frame-Options, nosniff, Referrer-Policy, no `X-Powered-By`.
- [ ] Upstash configured for shared rate limiting (`UPSTASH_*`).
- [ ] Meta: `NEXT_PUBLIC_META_PIXEL_ID` set at build time, Events Manager shows PageView, InitiateCheckout and Purchase (browser and server, deduplicated), CAPI tested with `META_TEST_EVENT_CODE` (then removed), and the domain verified.
- [ ] Firestore: a sandbox payment created a `registrations` row and two `paid_contacts` documents; paying again with the same email opens `/already-paid`; `firestore.rules` is deployed.
- [ ] Resend: the sending domain is verified, and the sandbox payment's confirmation email arrived with a working WhatsApp button.
- [ ] 2FA is on for the Cashfree dashboard, the host, the registrar and GitHub. Only the people who need access have it.
- [ ] `npm audit --omit=dev` has been reviewed, and the lockfile is committed.
- [ ] Rotate the Cashfree secret if it was ever shared in chat or email.

## Operations

- **Logs:** `[orders]`, `[webhook]`, `[thank-you]`, `[meta-capi]`, `[buyers]`. They contain order ids and error codes only. To find a buyer, look in the Firestore `registrations` table or search the Cashfree dashboard by order id (`wb_…`). `[buyers] second paid order` names an order to refund.
- **Webhook retries:** a 503 from the webhook (for example, Cashfree was briefly unreachable) makes Cashfree retry later. The same payload is handled only once per instance.
- **Refunds:** issue them from the Cashfree dashboard. The app never moves money on its own.
- **After the webinar:** new orders are refused 30 minutes after the start time. Pause the ads too.
