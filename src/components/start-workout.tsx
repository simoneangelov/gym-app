"use client";

import { useState } from "react";
import { createWorkout } from "@/app/actions";
import { SubmitButton } from "./submit-button";

function localToday() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function StartWorkout() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full py-3.5 text-base">
        + Start workout
      </button>
    );
  }

  return (
    <form action={createWorkout} className="card space-y-3 p-4">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input name="name" placeholder="Push day, Legs, …" autoFocus className="field" maxLength={80} />
        <input name="performed_on" type="date" defaultValue={localToday()} className="field w-auto" />
      </div>
      <div className="flex gap-2">
        <SubmitButton className="btn-primary flex-1" pendingText="Starting…">Start</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
