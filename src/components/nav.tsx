import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireUser } from "@/lib/supabase/server";

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-900 bg-[#0b0b0c]/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-zinc-950">L</span>
          Lift Log
        </Link>
        <Suspense>
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}

async function NavLinks() {
  const email = hasSupabaseEnv ? (await requireUser()).email : null;

  if (!email) return null;
  return (
    <nav className="ml-auto flex items-center gap-4 text-sm text-zinc-400">
      <Link href="/" className="hover:text-zinc-100">Workouts</Link>
      <Link href="/exercises" className="hover:text-zinc-100">Exercises</Link>
      <form action={signOut}>
        <button className="hover:text-zinc-100" title={email}>Sign out</button>
      </form>
    </nav>
  );
}
