// Which language this build shows on `/` (and `/dark`). One codebase, two sites (30 Sep 2026):
// - Tamil site (default): the Tanglish copy; `/en` still shows English.
// - English site (the ENG repo's server): NEXT_PUBLIC_SITE_LANG=en in .env before `npm run build`.
export const SITE_LANG: "en" | undefined = process.env.NEXT_PUBLIC_SITE_LANG?.trim().toLowerCase() === "en" ? "en" : undefined;
