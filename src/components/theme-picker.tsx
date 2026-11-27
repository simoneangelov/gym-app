"use client";

import { useEffect } from "react";
import { setTheme } from "@/app/actions";
import { THEME_BG, THEME_COOKIE, THEME_LABELS, THEMES, type Theme } from "@/lib/theme";

// Swatch colors are fixed (not tokens) so each one previews its own theme.
const SWATCH: Record<Theme, string> = {
  dark: "linear-gradient(135deg, #0b0b0c 50%, #c6f432 50%)",
  light: "linear-gradient(135deg, #ffffff 50%, #4d7c0f 50%)",
  pink: "linear-gradient(135deg, #ffe3f1 50%, #e0218a 50%)",
};

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BG[theme]);
}

/**
 * Keeps this device in line with the theme saved on the account (e.g. first
 * sign-in on a new phone), and refreshes the cookie the pre-paint script reads
 * and the browser's theme-color. Renders nothing; always mounted in the header.
 */
export function ThemeSync({ theme }: { theme: Theme }) {
  useEffect(() => apply(theme), [theme]);
  return null;
}

/** Theme choice in the account menu. Switches instantly, then saves to the account. */
export function ThemePicker({ theme }: { theme: Theme }) {
  return (
    <form action={setTheme} className="px-3 py-2" aria-label="Color theme">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Theme</p>
      <div className="grid grid-cols-3 gap-1.5">
        {THEMES.map((t) => (
          <button
            key={t}
            name="theme"
            value={t}
            onClick={() => apply(t)}
            aria-pressed={t === theme}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-medium transition active:scale-95 ${
              t === theme ? "border-accent text-zinc-100" : "border-zinc-800 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            <span className="h-6 w-6 rounded-full border border-zinc-700" style={{ background: SWATCH[t] }} />
            {THEME_LABELS[t]}
          </button>
        ))}
      </div>
    </form>
  );
}
