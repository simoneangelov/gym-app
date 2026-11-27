"use client";

import { useActionState } from "react";
import { addSet } from "@/app/actions";
import type { WeightUnit } from "@/lib/units";
import { StepperField, weightIncrement } from "./stepper-field";

type Props = {
  workoutId: string;
  unit: WeightUnit;
  /** Fixed exercise (inside an exercise block). Omit to show the exercise picker. */
  exercise?: string;
  exerciseOptions?: string[];
  defaultReps?: number;
  /** In the user's unit. */
  defaultWeight?: number;
};

export function AddSetForm({ workoutId, unit, exercise, exerciseOptions = [], defaultReps, defaultWeight }: Props) {
  const [state, action, pending] = useActionState(addSet, undefined);
  const picker = exercise === undefined;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="workout_id" value={workoutId} />
      {picker ? (
        <>
          <input
            name="exercise"
            list="exercise-options"
            placeholder="Exercise (e.g. Bench Press)"
            required
            maxLength={80}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
            aria-label="Exercise"
            className="field"
          />
          <datalist id="exercise-options">
            {exerciseOptions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </>
      ) : (
        <input type="hidden" name="exercise" value={exercise} />
      )}

      <div className="grid grid-cols-2 gap-2">
        <StepperField
          name="weight"
          label={`Weight (${unit})`}
          defaultValue={defaultWeight}
          increment={weightIncrement(unit)}
          decimal
        />
        <StepperField name="reps" label="Reps" defaultValue={defaultReps} increment={1} required />
      </div>

      {picker ? (
        <div className="grid grid-cols-2 items-end gap-2">
          <StepperField name="count" label="Sets" defaultValue={3} increment={1} min={1} />
          <button className="btn-primary h-13 text-base" disabled={pending}>
            {pending ? "Adding…" : "Add exercise"}
          </button>
        </div>
      ) : (
        <button className="btn-primary h-13 w-full text-base" disabled={pending}>
          {pending ? "Logging…" : "Log set"}
        </button>
      )}
      {state?.error && <p className="text-sm text-amber-400">{state.error}</p>}
    </form>
  );
}
