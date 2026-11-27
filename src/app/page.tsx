import Link from "next/link";
import { SetupNotice } from "@/components/setup-notice";
import { StartWorkout } from "@/components/start-workout";
import { daysAgoISO, formatDate } from "@/lib/format";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireUser } from "@/lib/supabase/server";

type WorkoutRow = {
  id: string;
  name: string;
  performed_on: string;
  workout_sets: { exercise_id: string; exercises: { name: string } | null }[];
};

// Everything here is the signed-in user's own data, read per request, so this route renders
// on the server at navigation time (loading.tsx shows meanwhile) instead of prerendering.
export const instant = false;

export default async function Home() {
  if (!hasSupabaseEnv) return <SetupNotice />;
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, performed_on, workout_sets(exercise_id, exercises(name))")
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<WorkoutRow[]>();

  const workouts = data ?? [];
  const weekAgo = daysAgoISO(7);
  const thisWeek = workouts.filter((w) => w.performed_on >= weekAgo).length;
  const totalSets = workouts.reduce((n, w) => n + w.workout_sets.length, 0);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-2">
        <Stat label="Last 7 days" value={thisWeek} />
        <Stat label="Workouts" value={workouts.length} />
        <Stat label="Sets logged" value={totalSets} />
      </section>

      <StartWorkout />

      {error && <p className="text-sm text-amber-400">{error.message}</p>}

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">History</h2>
        {workouts.length === 0 && (
          <p className="card p-6 text-center text-zinc-400">No workouts yet. Start your first one above.</p>
        )}
        {workouts.map((w) => {
          const names = [...new Set(w.workout_sets.map((s) => s.exercises?.name).filter(Boolean))];
          return (
            <Link key={w.id} href={`/workouts/${w.id}`} className="card block p-4 transition hover:border-zinc-700 active:scale-[0.99] active:bg-zinc-900">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate font-semibold">{w.name}</span>
                <span className="shrink-0 text-sm text-zinc-500">{formatDate(w.performed_on)}</span>
              </div>
              <p className="mt-1 truncate text-sm text-zinc-400">
                {names.length ? names.join(" · ") : "No sets yet"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {names.length} exercise{names.length === 1 ? "" : "s"} · {w.workout_sets.length} set
                {w.workout_sets.length === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-3">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="truncate text-xs text-zinc-500">{label}</div>
    </div>
  );
}
