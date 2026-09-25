// Business details shown on the policy pages (and required by Cashfree's website review).
// Safe to import from client or server. Replace EVERY [PLACEHOLDER] with real details before go-live;
// never invent them. `npm run check:placeholders` lists any that are left.

export const BUSINESS = {
  legalName: "[BUSINESS LEGAL NAME]",
  /** Brand shown to buyers. */
  brand: "Priyadharsini · Saffron",
  address: "[ADDRESS]",
  supportEmail: "[SUPPORT EMAIL]",
  supportPhone: "[SUPPORT PHONE]",
  supportHours: "Monday to Saturday, 10 am to 6 pm IST",
  grievanceOfficer: "[GRIEVANCE OFFICER]",
  grievanceEmail: "[GRIEVANCE EMAIL]",
  /** City for the courts clause in the Terms. */
  jurisdictionCity: "[CITY]",
  gstin: "[GSTIN, if registered]",
} as const;

/** Date shown as "Last updated" on the policy pages. Change it whenever the text changes. */
export const POLICIES_UPDATED = "26 September 2026";
