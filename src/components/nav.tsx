import Link from "next/link";
import { Suspense } from "react";
import { setWeightUnit } from "@/app/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getWeightUnit, requireUser } from "@/lib/supabase/server";
import { AccountMenu } from "./account-menu";
import { HeaderLinks, TabBarLinks } from "./nav-links";

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-900 bg-[#0b0b0c]/90 pt-safe backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-safe">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-zinc-950">L</span>
          Lift Log
        </Link>
        <Suspense>
          <HeaderControls />
        </Suspense>
      </div>
    </header>
  );
}

async function HeaderControls() {
  const email = hasSupabaseEnv ? (await requireUser()).email : null;
  if (!email) return null;
  const unit = await getWeightUnit();
  return (
    <>
      <HeaderLinks />
      <div className="ml-auto flex items-center gap-1">
        <form
          action={setWeightUnit}
          className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-0.5 text-sm"
          aria-label="Weight unit"
        >
          {(["lb", "kg"] as const).map((u) => (
            <button
              key={u}
              name="unit"
              value={u}
              aria-pressed={u === unit}
              title={`Show weights in ${u}`}
              className={`h-9 min-w-11 rounded-[10px] px-2.5 font-medium transition ${
                u === unit ? "bg-zinc-700 text-zinc-50" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {u}
            </button>
          ))}
        </form>
        <AccountMenu email={email} />
      </div>
    </>
  );
}

/** Bottom tab bar on phones. Hidden when signed out. */
export function TabBar() {
  return (
    <Suspense>
      <TabBarInner />
    </Suspense>
  );
}

async function TabBarInner() {
  const signedIn = hasSupabaseEnv && Boolean((await requireUser()).userId);
  return signedIn ? <TabBarLinks /> : null;
}
