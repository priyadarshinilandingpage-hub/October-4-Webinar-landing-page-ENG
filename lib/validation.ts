import { z } from "zod";

// Shared by the checkout form (client) and the order route (server). The server always re-validates.
// Field names are a contract with components/CheckoutForm.tsx: keep them stable.

const utm = z
  .string()
  .max(60)
  .regex(/^[A-Za-z0-9_.\- ]*$/)
  .optional();

/** Accepts "98765 43210", "+91 98765-43210", "09876543210", "(+91) 9876543210" → "9876543210". */
export function normalizeIndianMobile(v: string): string {
  return v.replace(/[\s\-().]/g, "").replace(/^(?:\+91|0091|91|0)(?=\d{10}$)/, "");
}

export const leadSchema = z
  .object({
    name: z
      .string()
      .transform((v) => v.trim().replace(/\s+/g, " "))
      .pipe(
        z
          .string()
          .min(2, "Please enter your name")
          .max(60, "Name is too long")
          .regex(/^[\p{L}\p{M} .'-]+$/u, "Please use letters only"),
      ),
    // Optional since 30 Sep 2026 (ad visitors often have no email handy; the WhatsApp number is what matters).
    // Razorpay notes hold at most 256 characters; 100 keeps emails sane. "" = not given.
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(100, "Email is too long")
      .pipe(z.union([z.literal(""), z.email("Please enter a valid email")]))
      .optional()
      .default(""),
    phone: z
      .string()
      .max(20, "Enter a 10-digit WhatsApp number")
      .transform(normalizeIndianMobile)
      .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit WhatsApp number")),
    consent: z.literal(true, { error: "Please accept to continue" }),
    marketingConsent: z.boolean().default(false),
    // Bot traps. `website` is a hidden field people never fill; the server rejects it when non-empty
    // (checked in the route, so bots don't learn which field gave them away). `elapsedMs` = time the form was open.
    website: z.string().max(200).optional().default(""),
    elapsedMs: z.number().int().min(0).max(86_400_000),
    utmSource: utm,
    utmCampaign: utm,
    utmContent: utm,
  })
  .strict(); // unknown keys (e.g. "amount") are rejected outright

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

/** Fields the form shows errors next to. Other issues get a generic message. */
export const USER_FIELDS = ["name", "email", "phone", "consent"] as const;
