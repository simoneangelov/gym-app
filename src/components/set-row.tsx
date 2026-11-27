"use client";

import { useActionState, useState } from "react";
import { deleteSet, updateSet } from "@/app/actions";
import { formatWeight } from "@/lib/format";
import type { WeightUnit } from "@/lib/units";
import { StepperField, weightIncrement } from "./stepper-field";
import { SubmitButton } from "./submit-button";

type Props = {
  id: string;
  workoutId: string;
  index: number;
  reps: number;
  /** Already converted to the user's unit. */
  weight: number;
  unit: WeightUnit;
  /** Visitors see the set but can't tap to edit it. */
  readOnly?: boolean;
};

/** One logged set. Tap it to edit weight and reps in place, or delete it. */
export function SetRow({ id, workoutId, index, reps, weight, unit, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false);
  // Close the editor once a save finishes without an error.
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof updateSet>>, fd: FormData) => {
    const result = await updateSet(prev, fd);
    if (!result?.error) setEditing(false);
    return result;
  }, undefined);

  const badge = (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
      {index}
    </span>
  );

  if (editing) {
    return (
      <li className="space-y-3 py-3">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="workout_id" value={workoutId} />
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {badge} Edit set {index}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StepperField
              name="weight"
              label={`Weight (${unit})`}
              defaultValue={Number(formatWeight(weight))}
              increment={weightIncrement(unit)}
              decimal
            />
            <StepperField name="reps" label="Reps" defaultValue={reps} increment={1} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)} disabled={pending}>
              Cancel
            </button>
            <button className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
        <form action={deleteSet}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="workout_id" value={workoutId} />
          <SubmitButton className="btn w-full text-red-400 active:bg-red-950/40" pendingText="Deleting…">
            Delete set
          </SubmitButton>
        </form>
        {state?.error && <p className="text-sm text-amber-400">{state.error}</p>}
      </li>
    );
  }

  const summary = (
    <span className="flex-1 text-base">
      <span className="font-semibold">{formatWeight(weight)}</span>
      <span className="text-zinc-500"> {unit}</span>
      <span className="px-1.5 text-zinc-600">×</span>
      <span className="font-semibold">{reps}</span>
      <span className="text-zinc-500"> reps</span>
    </span>
  );

  if (readOnly) {
    return (
      <li className="flex min-h-12 items-center gap-3 tabular-nums">
        {badge}
        {summary}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 text-left tabular-nums transition active:bg-zinc-800/70 hover:bg-zinc-800/40"
        aria-label={`Set ${index}: ${formatWeight(weight)} ${unit} for ${reps} reps. Tap to edit.`}
      >
        {badge}
        {summary}
        <span className="text-xs text-zinc-600">Edit</span>
      </button>
    </li>
  );
}
