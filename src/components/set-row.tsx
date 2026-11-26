"use client";

import { useActionState, useState } from "react";
import { deleteSet, updateSet } from "@/app/actions";
import { formatWeight } from "@/lib/format";
import type { WeightUnit } from "@/lib/units";
import { NumberField } from "./add-set-form";
import { SubmitButton } from "./submit-button";

type Props = {
  id: string;
  workoutId: string;
  index: number;
  reps: number;
  /** Already converted to the user's unit. */
  weight: number;
  unit: WeightUnit;
};

/** One logged set. Tap the numbers to edit weight and reps in place. */
export function SetRow({ id, workoutId, index, reps, weight, unit }: Props) {
  const [editing, setEditing] = useState(false);
  // Close the editor once a save finishes without an error.
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof updateSet>>, fd: FormData) => {
    const result = await updateSet(prev, fd);
    if (!result?.error) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <li className="py-2">
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="workout_id" value={workoutId} />
          <span className="w-6 shrink-0 text-sm text-zinc-500">{index}</span>
          <div className="grid flex-1 grid-cols-2 gap-2">
            <NumberField name="weight" label={unit} defaultValue={Number(formatWeight(weight))} step="any" />
            <NumberField name="reps" label="reps" defaultValue={reps} required />
          </div>
          <button className="btn-primary px-3" disabled={pending}>
            {pending ? "…" : "Save"}
          </button>
          <button type="button" className="btn-ghost px-3" onClick={() => setEditing(false)} disabled={pending}>
            Cancel
          </button>
        </form>
        {state?.error && <p className="mt-1 pl-8 text-sm text-amber-400">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 py-2 tabular-nums">
      <span className="w-6 text-sm text-zinc-500">{index}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex-1 rounded-md text-left hover:bg-zinc-800/60"
        aria-label={`Edit set ${index}`}
      >
        <span className="font-semibold">{formatWeight(weight)}</span>
        <span className="text-zinc-500"> {unit} × </span>
        <span className="font-semibold">{reps}</span>
        <span className="text-zinc-500"> reps</span>
      </button>
      <form action={deleteSet}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="workout_id" value={workoutId} />
        <SubmitButton className="px-2 text-zinc-600 hover:text-red-400" aria-label="Delete set">
          ✕
        </SubmitButton>
      </form>
    </li>
  );
}
