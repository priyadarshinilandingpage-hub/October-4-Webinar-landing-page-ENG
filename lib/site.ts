// Which language this build shows on `/` (and `/dark`). One codebase for both languages:
// - English (default since 30 Sep 2026: Shyam, only the English page is hosted, on the same domain).
// - Tanglish: NEXT_PUBLIC_SITE_LANG=ta in .env before `npm run build`. `/en` is always English.
export const SITE_LANG: "en" | undefined = process.env.NEXT_PUBLIC_SITE_LANG?.trim().toLowerCase() === "ta" ? undefined : "en";
