export const THEMES = ["dark", "light", "pink"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "dark";

/** Cookie the pre-paint script reads, so the page never flashes the wrong theme. */
export const THEME_COOKIE = "theme";

export const THEME_LABELS: Record<Theme, string> = {
  dark: "Dark",
  light: "Light",
  pink: "Pink",
};

/** Page background per theme; also used for the browser's theme-color. */
export const THEME_BG: Record<Theme, string> = {
  dark: "#0b0b0c",
  light: "#f4f4f5",
  pink: "#ffe3f1",
};

export function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}

/**
 * Runs inline in <head> before the first paint: reads the theme cookie and sets
 * data-theme on <html>. Kept tiny and dependency-free on purpose.
 */
export const themeInitScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(${THEMES.join("|")})(?:;|$)/);if(m)document.documentElement.dataset.theme=m[1];}catch(e){}})();`;
