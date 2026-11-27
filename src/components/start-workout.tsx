"use client";

import { useState } from "react";
import { createWorkout } from "@/app/actions";
import { SubmitButton } from "./submit-button";

function localToday() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** Name + date form that creates a workout and opens it. Shared by the page and the tab bar sheet. */
export function StartWorkoutForm({ onCancel, className = "" }: { onCancel: () => void; className?: string }) {
  return (
    <form action={createWorkout} className={`space-y-3 ${className}`}>
      <input
        name="workout_name"
        autoComplete="off"
        placeholder="Push day, Legs, …"
        autoFocus
        autoCapitalize="words"
        enterKeyHint="go"
        aria-label="Workout name"
        className="field"
        maxLength={80}
      />
      <input name="performed_on" type="date" defaultValue={localToday()} aria-label="Date" className="field" />
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost h-12">Cancel</button>
        <SubmitButton className="btn-primary h-12 text-base" pendingText="Starting…">Start</SubmitButton>
      </div>
    </form>
  );
}

/** Inline start button for wider screens, where there is no bottom tab bar. */
export function StartWorkout() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary h-14 w-full text-base">
        + Start workout
      </button>
    );
  }

  return <StartWorkoutForm onCancel={() => setOpen(false)} className="card p-4" />;
}
