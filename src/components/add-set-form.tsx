"use client";

import { useActionState } from "react";
import { addSet } from "@/app/actions";
import type { WeightUnit } from "@/lib/units";

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
    <form action={action} className="space-y-2">
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

      <div className={`grid gap-2 ${picker ? "grid-cols-[1fr_1fr_4.5rem_auto]" : "grid-cols-[1fr_1fr_auto]"}`}>
        <NumberField name="weight" label={unit} defaultValue={defaultWeight} step="any" />
        <NumberField name="reps" label="reps" defaultValue={defaultReps} required />
        {picker && <NumberField name="count" label="sets" defaultValue={3} />}
        <button className="btn-primary px-4" disabled={pending} aria-label="Add set">
          {pending ? "…" : picker ? "Add" : "+ Set"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-amber-400">{state.error}</p>}
    </form>
  );
}

export function NumberField({
  name,
  label,
  defaultValue,
  step = "1",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: number;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="relative block">
      <input
        name={name}
        type="number"
        inputMode={step === "1" ? "numeric" : "decimal"}
        min={0}
        step={step}
        defaultValue={defaultValue}
        required={required}
        placeholder="0"
        className="field pr-11 tabular-nums"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-zinc-500">
        {label}
      </span>
    </label>
  );
}
