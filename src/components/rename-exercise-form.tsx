"use client";

import { useActionState } from "react";
import { renameExercise } from "@/app/actions";

export function RenameExerciseForm({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(renameExercise, undefined);

  return (
    <form action={action} className="flex-1 space-y-1">
      <div className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <input
          name="name"
          defaultValue={name}
          required
          maxLength={80}
          aria-label="Exercise name"
          className="field py-1.5 text-sm"
        />
        <button className="btn-ghost px-3 py-1.5 text-xs" disabled={pending}>
          {pending ? "…" : "Rename"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-amber-400">{state.error}</p>}
    </form>
  );
}
