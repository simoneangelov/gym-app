"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartIcon, DumbbellIcon } from "./icons";

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

/** Bottom tab bar for phones, where the thumb already is. */
export function TabBarLinks() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800/80 bg-bg pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="mx-auto grid h-(--tabbar-h) max-w-xl grid-cols-2 px-safe">
        {LINKS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition active:scale-95 ${
                active ? "text-accent" : "text-zinc-500"
              }`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
