import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteWorkout, updateWorkout } from "@/app/actions";
import { AddSetForm } from "@/components/add-set-form";
import { SetRow } from "@/components/set-row";
import { SubmitButton } from "@/components/submit-button";
import { formatDate, formatWeight } from "@/lib/format";
import { getWeightUnit, requireUser } from "@/lib/supabase/server";
import { toUnit } from "@/lib/units";

type SetRow = {
  id: string;
  reps: number;
  weight: number;
  exercise_id: string;
  exercises: { name: string } | null;
};

type PrevRow = {
  exercise_id: string;
  workout_id: string;
  reps: number;
  weight: number;
  workouts: { performed_on: string } | null;
};

export default async function WorkoutPage({ params }: PageProps<"/workouts/[id]">) {
  const { id } = await params;
  if (!hasSupabaseEnv) return <SetupNotice />;
  const { supabase } = await requireUser();

  const [unit, { data: workout }, { data: sets }, { data: allExercises }] = await Promise.all([
    getWeightUnit(),
    supabase.from("workouts").select("id, name, performed_on, notes").eq("id", id).maybeSingle(),
    supabase
      .from("workout_sets")
      .select("id, reps, weight, exercise_id, exercises(name)")
      .eq("workout_id", id)
      .order("created_at")
      .returns<SetRow[]>(),
    supabase.from("exercises").select("name").order("name"),
  ]);
  if (!workout) notFound();

  // Group sets by exercise, in the order exercises were first logged.
  const blocks = new Map<string, { name: string; sets: SetRow[] }>();
  for (const s of sets ?? []) {
    const b = blocks.get(s.exercise_id) ?? { name: s.exercises?.name ?? "Exercise", sets: [] };
    b.sets.push(s);
    blocks.set(s.exercise_id, b);
  }

  // "Last time" for each exercise: the most recent earlier workout that had it.
  const lastTime = new Map<string, { date: string; sets: PrevRow[] }>();
  if (blocks.size) {
    const { data: prev } = await supabase
      .from("workout_sets")
      .select("exercise_id, workout_id, reps, weight, workouts!inner(performed_on)")
      .in("exercise_id", [...blocks.keys()])
      .neq("workout_id", id)
      .lte("workouts.performed_on", workout.performed_on)
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<PrevRow[]>();
    const latestWorkout = new Map<string, { wid: string; date: string }>();
    for (const p of prev ?? []) {
      const date = p.workouts?.performed_on ?? "";
      const cur = latestWorkout.get(p.exercise_id);
      if (!cur || date > cur.date) latestWorkout.set(p.exercise_id, { wid: p.workout_id, date });
    }
    for (const [exId, { wid, date }] of latestWorkout) {
      lastTime.set(exId, {
        date,
        sets: (prev ?? []).filter((p) => p.exercise_id === exId && p.workout_id === wid).reverse(),
      });
    }
  }

  const totalSets = sets?.length ?? 0;
  const volume = (sets ?? []).reduce((v, s) => v + toUnit(s.weight, unit) * s.reps, 0);

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">← All workouts</Link>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{workout.name}</h1>
            <p className="text-sm text-zinc-500">
              {formatDate(workout.performed_on)} · {totalSets} sets · {formatWeight(Math.round(volume))} {unit} volume
            </p>
            {workout.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{workout.notes}</p>}
          </div>
          <span className="btn-ghost shrink-0 px-3 py-1.5 text-xs group-open:hidden">Edit</span>
        </summary>
        <form action={updateWorkout} className="card mt-3 space-y-2 p-4">
          <input type="hidden" name="id" value={workout.id} />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input name="name" defaultValue={workout.name} maxLength={80} className="field" />
            <input name="performed_on" type="date" defaultValue={workout.performed_on} className="field w-auto" />
          </div>
          <textarea name="notes" defaultValue={workout.notes ?? ""} placeholder="Notes" rows={2} className="field" />
          <SubmitButton pendingText="Saving…">Save</SubmitButton>
        </form>
      </details>

      {[...blocks].map(([exId, block]) => {
        const last = block.sets[block.sets.length - 1];
        const prev = lastTime.get(exId);
        return (
          <section key={exId} className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">{block.name}</h2>
              {prev && (
                <span className="truncate text-xs text-zinc-500" title={`Last time, ${formatDate(prev.date)}`}>
                  Last: {prev.sets.map((s) => `${formatWeight(toUnit(s.weight, unit))}×${s.reps}`).join(", ")}
                </span>
              )}
            </div>
            <ol className="mt-3 divide-y divide-zinc-800/80">
              {block.sets.map((s, i) => (
                <SetRow
                  key={s.id}
                  id={s.id}
                  workoutId={workout.id}
                  index={i + 1}
                  reps={s.reps}
                  weight={toUnit(s.weight, unit)}
                  unit={unit}
                />
              ))}
            </ol>
            <div className="mt-3">
              <AddSetForm
                key={block.sets.length}
                workoutId={workout.id}
                unit={unit}
                exercise={block.name}
                defaultReps={last?.reps}
                defaultWeight={last ? Number(formatWeight(toUnit(last.weight, unit))) : undefined}
              />
            </div>
          </section>
        );
      })}

      <section className="card border-dashed p-4">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Add exercise</h2>
        <AddSetForm
          key={`new-${totalSets}`}
          workoutId={workout.id}
          unit={unit}
          exerciseOptions={(allExercises ?? []).map((e) => e.name)}
        />
      </section>

      <form action={deleteWorkout} className="pt-4 text-center">
        <input type="hidden" name="id" value={workout.id} />
        <SubmitButton
          className="text-sm text-zinc-600 hover:text-red-400"
          pendingText="Deleting…"
          confirmText="Delete this workout and all its sets?"
        >
          Delete workout
        </SubmitButton>
      </form>
    </div>
  );
}
