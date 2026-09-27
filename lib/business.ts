// Business details. Safe to import from client or server.

export const BUSINESS = {
  /** Brand shown to buyers: policy page footers and the Razorpay checkout (unless RAZORPAY_BRAND_NAME is set). */
  brand: "Priyadharsini · Saffron",
} as const;

/** Date shown as "Last updated" on a policy page that uses it. Change it whenever the text changes. */
export const POLICIES_UPDATED = "26 September 2026";
