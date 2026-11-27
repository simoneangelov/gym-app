"use client";

import { useState } from "react";
import { formatWeight } from "@/lib/format";
import { MinusIcon, PlusIcon } from "./icons";

type Props = {
  name: string;
  label: string;
  defaultValue?: number;
  /** How much − and + change the value. */
  increment: number;
  /** Allow decimals (weights). Reps and set counts are whole numbers. */
  decimal?: boolean;
  min?: number;
  required?: boolean;
};

/**
 * A number field with big − / + buttons on either side, so a set can be logged with one thumb
 * without opening the keyboard. Tapping the number still opens the numeric keypad.
 */
export function StepperField({ name, label, defaultValue, increment, decimal, min = 0, required }: Props) {
  const [value, setValue] = useState(defaultValue === undefined ? "" : formatWeight(defaultValue));

  function bump(dir: 1 | -1) {
    const n = Number(value) || 0;
    const next = Math.max(min, Math.round((n + dir * increment) * 100) / 100);
    setValue(formatWeight(next));
  }

  const btn =
    "grid w-12 shrink-0 place-items-center text-zinc-300 transition active:scale-90 active:bg-zinc-800 disabled:opacity-30";

  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-zinc-500">{label}</span>
      <div className="flex h-13 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 focus-within:border-accent">
        <button
          type="button"
          className={btn}
          onClick={() => bump(-1)}
          disabled={(Number(value) || 0) <= min}
          aria-label={`Decrease ${label}`}
        >
          <MinusIcon className="h-5 w-5" />
        </button>
        <input
          name={name}
          type="number"
          inputMode={decimal ? "decimal" : "numeric"}
          enterKeyHint="done"
          min={min}
          step={decimal ? "any" : "1"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          required={required}
          placeholder="0"
          aria-label={label}
          className="w-full min-w-0 bg-transparent text-center text-lg font-semibold tabular-nums text-zinc-50 outline-none placeholder:text-zinc-600"
        />
        <button type="button" className={btn} onClick={() => bump(1)} aria-label={`Increase ${label}`}>
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
    </label>
  );
}

/** Default − / + step for weights: 5 lb or 2.5 kg, the smallest common plate pair. */
export const weightIncrement = (unit: string) => (unit === "kg" ? 2.5 : 5);
