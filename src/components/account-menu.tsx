"use client";

import { useEffect, useRef, useState } from "react";
import { setVisibleToVisitors, signOut } from "@/app/actions";
import type { Theme } from "@/lib/theme";
import { UserIcon } from "./icons";
import { ThemePicker } from "./theme-picker";

/**
 * Account button that opens a small sheet with the email, the color theme, the visitor
 * switch and Sign out, so Sign out can't be hit by accident.
 */
export function AccountMenu({
  email,
  theme,
  visibleToVisitors,
}: {
  email: string;
  theme: Theme;
  visibleToVisitors: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account"
        className="grid h-11 w-11 place-items-center rounded-xl text-zinc-400 transition hover:text-zinc-100 active:bg-zinc-900"
      >
        <UserIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden bg-zinc-900 p-1 shadow-xl shadow-black/50">
          <p className="truncate px-3 py-2.5 text-sm text-zinc-500">{email}</p>
          <ThemePicker theme={theme} />
          <form action={setVisibleToVisitors}>
            <input type="hidden" name="visible" value={String(!visibleToVisitors)} />
            <button
              role="switch"
              aria-checked={visibleToVisitors}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm text-zinc-100 hover:bg-zinc-800 active:bg-zinc-800"
            >
              <span>
                Show my workouts to visitors
                <span className="block text-xs text-zinc-500">Read-only, no account needed</span>
              </span>
              <span
                aria-hidden
                className={`relative h-6 w-10 shrink-0 rounded-full transition ${visibleToVisitors ? "bg-accent" : "bg-zinc-700"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-zinc-950 shadow transition-all ${visibleToVisitors ? "left-[1.125rem]" : "left-0.5"}`}
                />
              </span>
            </button>
          </form>
          <form action={signOut}>
            <button className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-zinc-100 hover:bg-zinc-800 active:bg-zinc-800">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
