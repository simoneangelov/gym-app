import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";
import { deleteExercise } from "@/app/actions";
import { ProgressChart, type ProgressPoint } from "@/components/progress-chart";
import { RenameExerciseForm } from "@/components/rename-exercise-form";
import { SubmitButton } from "@/components/submit-button";
import { formatDate, formatWeight } from "@/lib/format";
import { getWeightUnit, requireUser } from "@/lib/supabase/server";
import { toUnit } from "@/lib/units";

type ExerciseRow = {
  id: string;
  name: string;
  workout_sets: {
    reps: number;
    weight: number;
    workout_id: string;
    workouts: { performed_on: string; name: string } | null;
  }[];
};

// Epley estimate of one-rep max.
const e1rm = (w: number, r: number) => (r <= 1 ? w : w * (1 + r / 30));

export default async function ExercisesPage() {
  if (!hasSupabaseEnv) return <SetupNotice />;
  const { supabase } = await requireUser();
  const unit = await getWeightUnit();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, workout_sets(reps, weight, workout_id, workouts(performed_on, name))")
    .order("name")
    .returns<ExerciseRow[]>();

  const exercises = (data ?? []).map((ex) => {
    const sets = ex.workout_sets.map((s) => ({ ...s, weight: toUnit(s.weight, unit) }));
    const best = sets.reduce<(typeof sets)[number] | null>(
      (b, s) => (!b || s.weight > b.weight || (s.weight === b.weight && s.reps > b.reps) ? s : b),
      null,
    );
    const bestE1rm = Math.max(0, ...sets.map((s) => e1rm(s.weight, s.reps)));

    const byWorkout = new Map<string, { date: string; name: string; workoutId: string; sets: typeof sets }>();
    for (const s of sets) {
      const g = byWorkout.get(s.workout_id) ?? {
        date: s.workouts?.performed_on ?? "",
        name: s.workouts?.name ?? "",
        workoutId: s.workout_id,
        sets: [],
      };
      g.sets.push(s);
      byWorkout.set(s.workout_id, g);
    }
    const history = [...byWorkout.values()].sort((a, b) => b.date.localeCompare(a.date));

    // One point per training day, oldest first. Several workouts on the same day are merged.
    const byDay = new Map<string, { e1rm: number; volume: number }>();
    for (const s of sets) {
      const date = s.workouts?.performed_on;
      if (!date) continue;
      const d = byDay.get(date) ?? { e1rm: 0, volume: 0 };
      d.e1rm = Math.max(d.e1rm, e1rm(s.weight, s.reps));
      d.volume += s.weight * s.reps;
      byDay.set(date, d);
    }
    const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
    const e1rmTrend: ProgressPoint[] = days.map(([date, d]) => ({ date, value: d.e1rm }));
    const volumeTrend: ProgressPoint[] = days.map(([date, d]) => ({ date, value: d.volume }));
    // Bodyweight-only exercises (every set at 0 weight) have nothing to chart.
    const hasLoad = days.some(([, d]) => d.volume > 0);

    return { ...ex, sets, best, bestE1rm, history, e1rmTrend, volumeTrend, hasLoad };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
      {error && <p className="text-sm text-amber-400">{error.message}</p>}
      {exercises.length === 0 && (
        <p className="card p-6 text-center text-zinc-400">
          Exercises appear here once you log a set in a workout.
        </p>
      )}
      {exercises.map((ex) => (
        <details key={ex.id} className="card group p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{ex.name}</h2>
              <p className="text-xs text-zinc-500">
                {ex.history.length} session{ex.history.length === 1 ? "" : "s"} · {ex.sets.length} sets
                {ex.history[0] && <> · last {formatDate(ex.history[0].date)}</>}
              </p>
            </div>
            {ex.best && (
              <div className="text-right tabular-nums">
                <div className="font-semibold text-accent">
                  {formatWeight(ex.best.weight)} × {ex.best.reps}
                </div>
                <div className="text-xs text-zinc-500">e1RM {formatWeight(Math.round(ex.bestE1rm))} {unit}</div>
              </div>
            )}
          </summary>

          {ex.hasLoad && ex.e1rmTrend.length >= 2 ? (
            <div className="mt-4 grid gap-4 border-t border-zinc-800 pt-3">
              <ProgressChart title="Estimated 1RM" unit={unit} points={ex.e1rmTrend} />
              <ProgressChart title="Total volume" unit={unit} points={ex.volumeTrend} />
            </div>
          ) : (
            ex.hasLoad && (
              <p className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                Log this exercise on another day to see a progress chart.
              </p>
            )
          )}

          <ul className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
            {ex.history.map((h) => (
              <li key={h.workoutId} className="flex items-baseline justify-between gap-3 text-sm">
                <Link href={`/workouts/${h.workoutId}`} className="shrink-0 text-zinc-400 hover:text-zinc-100">
                  {formatDate(h.date)}
                </Link>
                <span className="text-right tabular-nums text-zinc-300">
                  {h.sets.map((s) => `${formatWeight(s.weight)}×${s.reps}`).join(", ")}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-start gap-2 border-t border-zinc-800 pt-3">
            <RenameExerciseForm id={ex.id} name={ex.name} />
            <form action={deleteExercise}>
              <input type="hidden" name="id" value={ex.id} />
              <SubmitButton
                className="btn-ghost px-3 py-1.5 text-xs text-red-400"
                confirmText={`Delete ${ex.name} and all its logged sets?`}
              >
                Delete
              </SubmitButton>
            </form>
          </div>
        </details>
      ))}
    </div>
  );
}
