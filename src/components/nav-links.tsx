"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { leaveVisitorMode } from "@/app/actions";
import { ChartIcon, DumbbellIcon, PlusIcon } from "./icons";
import { StartWorkoutForm } from "./start-workout";

const LINKS = [
  { href: "/", label: "Workouts", Icon: DumbbellIcon, match: (p: string) => p === "/" || p.startsWith("/workouts") },
  { href: "/exercises", label: "Exercises", Icon: ChartIcon, match: (p: string) => p.startsWith("/exercises") },
];

/** Inline links in the header, shown on tablet and desktop widths. */
export function HeaderLinks() {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 text-sm sm:flex" aria-label="Main">
      {LINKS.map(({ href, label, match }) => (
        <Link
          key={href}
          href={href}
          aria-current={match(path) ? "page" : undefined}
          className="rounded-lg px-3 py-2 text-zinc-400 hover:text-zinc-100 aria-[current=page]:text-zinc-100"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function TabLink({ href, label, Icon, active }: (typeof LINKS)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition active:scale-95 ${
        active ? "text-accent" : "text-zinc-500"
      }`}
    >
      <Icon className="h-6 w-6" />
      {label}
      <span
        aria-hidden
        className={`absolute bottom-1.5 h-1 w-1 rounded-full bg-accent transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
      />
    </Link>
  );
}

/**
 * Floating bottom tab bar for phones, where the thumb already is. The raised circle in the
 * middle starts a workout from any screen via a bottom sheet. Visitors (readOnly) get a
 * prompt to sign in there instead.
 */
export function TabBarLinks({ readOnly = false }: { readOnly?: boolean }) {
  const path = usePathname();
  const sheet = useRef<HTMLDialogElement>(null);
  // The form only mounts while open, so each open starts empty with today's date.
  const [open, setOpen] = useState(false);

  const openSheet = () => {
    setOpen(true);
    sheet.current?.showModal();
  };
  const closeSheet = () => sheet.current?.close();

  const [workouts, exercises] = LINKS;

  return (
    <>
      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-safe pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:hidden"
      >
        <div className="pointer-events-auto relative mx-auto grid h-16 max-w-md grid-cols-[1fr_5.5rem_1fr] items-center rounded-[1.75rem] border border-zinc-800 bg-zinc-900/85 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.3)] backdrop-blur-xl">
          <TabLink {...workouts} active={workouts.match(path)} />
          <div className="relative h-full">
            <button
              type="button"
              onClick={openSheet}
              aria-label="Start workout"
              aria-haspopup="dialog"
              aria-expanded={open}
              className="absolute left-1/2 -top-7 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-accent text-zinc-950 shadow-lg shadow-accent/40 ring-[6px] ring-bg transition hover:brightness-110 active:scale-95 active:brightness-90"
            >
              <PlusIcon className="h-8 w-8" strokeWidth={2.5} />
            </button>
          </div>
          <TabLink {...exercises} active={exercises.match(path)} />
        </div>
      </nav>

      <dialog
        ref={sheet}
        aria-labelledby="start-workout-title"
        onClose={() => setOpen(false)}
        // Tapping the dimmed backdrop (the dialog element itself, outside the panel) closes it.
        onClick={(e) => e.target === e.currentTarget && closeSheet()}
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-none bg-transparent p-0 text-zinc-100 backdrop:bg-black/40 backdrop:backdrop-blur-sm sm:hidden"
      >
        <div className="mx-auto max-w-xl rounded-t-3xl border border-b-0 border-zinc-800 bg-bg px-safe pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div aria-hidden className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-zinc-700" />
          <h2 id="start-workout-title" className="mb-3 text-lg font-semibold">Start workout</h2>
          {open &&
            (readOnly ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  You&apos;re viewing as a visitor. Sign in to log your own workouts.
                </p>
                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <button type="button" onClick={closeSheet} className="btn-ghost h-12">Not now</button>
                  <form action={leaveVisitorMode} className="grid">
                    <button className="btn-primary h-12 text-base">Sign in</button>
                  </form>
                </div>
              </div>
            ) : (
              <StartWorkoutForm onCancel={closeSheet} />
            ))}
        </div>
      </dialog>
    </>
  );
}
