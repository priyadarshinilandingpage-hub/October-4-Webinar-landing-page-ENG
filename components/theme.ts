// Shared by the server (page render) and the client toggle. Keep plain constants only.
export type Theme = "light" | "dark";

/** First-party cookie holding the visitor's light/dark choice (a display preference, nothing personal). */
export const THEME_COOKIE = "theme";

/** Browser chrome colour per theme (viewport themeColor / meta theme-color). */
export const THEME_COLOR: Record<Theme, string> = { light: "#fbf9fc", dark: "#140a1f" };
