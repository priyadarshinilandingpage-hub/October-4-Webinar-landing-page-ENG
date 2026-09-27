import { accessSync, constants, mkdirSync } from "node:fs";
import { PAID_CONTACTS } from "./buyers";
import { readEnv, type RawEnv, type ServerEnv } from "./env";
import { firestoreEnabled, getDoc } from "./firestore";
import { dataDir } from "./local-store";
import { keysWork } from "./razorpay";

// Runs once when the server starts (instrumentation.ts) and prints, in plain words, whether payments will work:
// settings, the Razorpay keys (one read-only call), the WhatsApp link and where the already-paid list is kept.
// See it with `pm2 logs webinar`. Names of settings only, never their values.

const log = (line: string) => console.log(`[startup] ${line}`);

export async function startupCheck(raw: RawEnv): Promise<void> {
  let env: ServerEnv;
  try {
    env = readEnv(raw);
  } catch (err) {
    log(`PAYMENTS ARE OFF. Fix these settings in .env, then restart: ${(err as Error).message.replace(/^.*?: /, "")}`);
    return;
  }

  log(`Site address: ${env.SITE_URL}${env.SITE_URL.startsWith("https://") ? "" : " (not https: fine for testing on this computer only)"}`);
  log(
    env.mode === "live"
      ? "Razorpay LIVE mode: real payments."
      : "Razorpay TEST mode: pretend payments only (no real money). Put the live keys in .env before running ads.",
  );
  log(env.WEBINAR_WHATSAPP_URL ? "WhatsApp group link: set." : "WhatsApp group link MISSING: paid buyers won't see the group button. Set WEBINAR_WHATSAPP_URL.");
  log(
    env.RAZORPAY_WEBHOOK_SECRET
      ? "Razorpay webhook secret: set."
      : "Razorpay webhook secret: not set (optional; the thank-you page still confirms payments).",
  );
  if (env.ignored.length) log(`Ignored because they look wrong (fix in .env): ${env.ignored.join(", ")}`);

  if (firestoreEnabled(env)) {
    try {
      await getDoc(env, PAID_CONTACTS, "startup_check");
      log(`Already-paid list: Firestore (${env.FIREBASE_PROJECT_ID}), working.`);
    } catch (err) {
      log(`Already-paid list: Firestore NOT working, check the FIREBASE_* settings: ${(err as Error).message}`);
    }
  } else {
    const dir = dataDir();
    try {
      mkdirSync(dir, { recursive: true });
      accessSync(dir, constants.W_OK);
      log(`Already-paid list: saved in ${dir} (Firestore not set up, which is fine).`);
    } catch {
      log(`Already-paid list: CAN'T WRITE to ${dir}. Repeat buyers are forgotten on restart; give the app write access there.`);
    }
  }

  try {
    log((await keysWork(env)) ? "Razorpay keys: working. Payments are ready." : "Razorpay keys REJECTED: check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (same mode, no spaces).");
  } catch (err) {
    log(`Couldn't reach Razorpay to test the keys (${(err as Error).message}). Check the server's internet connection.`);
  }
}
