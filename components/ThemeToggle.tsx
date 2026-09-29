"use client";

import { useEffect, useState } from "react";
import { THEME_COLOR, THEME_COOKIE, type Theme } from "./theme";

/** The theme in force: the page wrapper's own setting (`/dark`), else <html> (set by public/boot.js). */
function current(): Theme {
  const t = document.querySelector<HTMLElement>(".theme-root")?.dataset.theme ?? document.documentElement.dataset.theme;
  return t === "dark" ? "dark" : "light";
}

/**
 * Light / dark switch. Sets data-theme on <html> and on the page wrapper (globals.css re-maps every token under
 * it), remembers the choice in a first-party cookie so the next visit starts in the same theme (public/boot.js),
 * and drops a ?theme= override from the address bar so a reload keeps the visitor's choice.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(current());
  }, []);

  function toggle() {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    const wrapper = document.querySelector<HTMLElement>(".theme-root");
    if (wrapper?.dataset.theme) wrapper.dataset.theme = next;
    setTheme(next);

    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${THEME_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);

    const url = new URL(location.href);
    if (url.searchParams.has("theme")) {
      url.searchParams.delete("theme");
      history.replaceState(history.state, "", url);
    }
  }

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className="theme-toggle"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
        {dark ? (
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5 7 7M17 17l1.5 1.5M5.5 18.5 7 17M17 7l1.5-1.5" />
          </g>
        ) : (
          <path
            d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
