"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions";
import { UserIcon } from "./icons";

/** Account button that opens a small sheet with the email and Sign out, so it can't be hit by accident. */
export function AccountMenu({ email }: { email: string }) {
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
