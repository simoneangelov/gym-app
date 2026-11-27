import Link from "next/link";
import { SetupNotice } from "@/components/setup-notice";
import { StartWorkout } from "@/components/start-workout";
import { WeekStrip } from "@/components/week-strip";
import { CALENDAR_MONTHS, daysAgoISO, formatDate } from "@/lib/format";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getViewer } from "@/lib/supabase/server";

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
  const { supabase, isVisitor } = await getViewer();

  const [{ data, error }, { data: calendarData }] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, name, performed_on, workout_sets(exercise_id, exercises(name))")
      .order("performed_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<WorkoutRow[]>(),
    // Just dates and names for the calendar, which scrolls back a year.
    supabase
      .from("workouts")
      .select("id, name, performed_on")
      .gte("performed_on", daysAgoISO(CALENDAR_MONTHS * 31 + 7))
      .order("performed_on")
      .order("created_at"),
  ]);

  const workouts = data ?? [];

  return (
    <div className="space-y-6">
      {!isVisitor && (
        <div className="hidden sm:block">
          <StartWorkout />
        </div>
      )}

      <WeekStrip workouts={calendarData ?? []} />

      {error && <p className="text-sm text-amber-400">{error.message}</p>}

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Recent</h2>
        {workouts.length === 0 && isVisitor && (
          <p className="card p-6 text-center text-zinc-400">No workouts to show yet.</p>
        )}
        {workouts.length === 0 && !isVisitor && (
          <p className="card p-6 text-center text-zinc-400">No workouts yet.{" "}
            <span className="sm:hidden">Tap + below to start your first one.</span>
            <span className="hidden sm:inline">Start your first one above.</span></p>
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
