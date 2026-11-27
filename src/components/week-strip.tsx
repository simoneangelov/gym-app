"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CALENDAR_MONTHS,
  CALENDAR_MONTHS_AHEAD,
  localISODate,
  monthWeeks,
  recentMonths,
  weekDays,
} from "@/lib/format";
import { ChevronDownIcon } from "./icons";

type Workout = { id: string; name: string; performed_on: string };

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

const noop = () => () => {};
/**
 * Today in the viewer's own time zone. The server can't know it, so it renders null
 * (an empty strip of the same size) and the browser fills the days in after hydration.
 */
function useToday() {
  return useSyncExternalStore(noop, () => localISODate(new Date()), () => null);
}

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function DayCell({ day, today, workouts }: { day: string | null; today: string | null; workouts?: Workout[] }) {
  if (!day) return <li aria-hidden className="h-9" />;
  const isToday = day === today;
  const isFuture = !!today && day > today;

  const circle = (
    <span
      className={`grid h-9 w-9 place-items-center rounded-full text-sm tabular-nums ${
        workouts
          ? "bg-accent font-semibold text-zinc-950"
          : isToday
            ? "font-semibold text-accent"
            : isFuture
              ? "text-zinc-600"
              : "text-zinc-300"
      } ${isToday ? "ring-2 ring-accent" : ""}`}
    >
      {parse(day).getDate()}
    </span>
  );
  const label = `${parse(day).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${
    workouts ? `: ${workouts.map((w) => w.name).join(", ")}` : ""
  }${isToday ? " (today)" : ""}`;

  return (
    <li className="flex justify-center">
      {workouts ? (
        <Link href={`/workouts/${workouts[0].id}`} aria-label={label} className="rounded-full active:scale-95">
          {circle}
        </Link>
      ) : (
        <span aria-label={label}>{circle}</span>
      )}
    </li>
  );
}

/**
 * This week, Sunday to Saturday. Tapping the month name in the header expands it into a
 * scrollable calendar of the past year and next month, opening on the current month, the
 * way phone calendar apps do. Days with a workout are filled in and link to it.
 */
export function WeekStrip({ workouts }: { workouts: Workout[] }) {
  const today = useToday();
  const [expanded, setExpanded] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Open the calendar on the current month (earlier months are above it, next month below).
  useEffect(() => {
    const current = scroller.current?.querySelector<HTMLElement>("[data-current]");
    if (expanded && scroller.current && current) scroller.current.scrollTop = current.offsetTop;
  }, [expanded]);

  const byDay = new Map<string, Workout[]>();
  for (const w of workouts) byDay.set(w.performed_on, [...(byDay.get(w.performed_on) ?? []), w]);

  const week = today ? weekDays(today) : Array<null>(7).fill(null);
  const todayColumn = today ? parse(today).getDay() : -1;
  const showMonths = expanded && !!today;
  const monthName = today ? parse(today).toLocaleDateString(undefined, { month: "long" }) : "\u00a0";

  return (
    <section className="card p-3" aria-label="Calendar">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse calendar to this week" : "Expand calendar to the full month"}
        className="-mt-1 mb-1 flex min-h-11 items-center gap-1 rounded-xl pr-2 pl-1 text-left transition active:bg-zinc-800/50"
      >
        <span className="text-base font-semibold text-zinc-100">{monthName}</span>
        <ChevronDownIcon
          className={`h-5 w-5 text-accent transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <div aria-hidden className="mb-1 grid grid-cols-7 gap-1">
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className={`text-center text-[11px] font-medium ${i === todayColumn ? "text-accent" : "text-zinc-500"}`}
          >
            {letter}
          </span>
        ))}
      </div>
      {showMonths ? (
        <div ref={scroller} className="relative -mx-1 max-h-[23rem] space-y-2 overflow-y-auto overscroll-contain px-1">
          {recentMonths(today, CALENDAR_MONTHS, CALENDAR_MONTHS_AHEAD).map((month, i) => (
            // Alternate months get a tinted panel so it's obvious where one ends and the next begins.
            <section
              key={month}
              data-current={month.slice(0, 7) === today.slice(0, 7) || undefined}
              aria-label={parse(month).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              className={`rounded-xl border px-1 pt-2 pb-2.5 ${
                i % 2 ? "border-zinc-800 bg-zinc-800/40" : "border-transparent"
              }`}
            >
              <h3 className="mb-1.5 px-1 text-sm">
                <span className="font-semibold text-accent">
                  {parse(month).toLocaleDateString(undefined, { month: "long" })}
                </span>{" "}
                <span className="text-zinc-500">{parse(month).getFullYear()}</span>
              </h3>
              <ol className="grid grid-cols-7 gap-x-1 gap-y-1.5">
                {monthWeeks(month)
                  .flat()
                  .map((day, j) => (
                    <DayCell
                      key={day ?? `blank-${j}`}
                      day={day}
                      today={today}
                      workouts={day ? byDay.get(day) : undefined}
                    />
                  ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <ol className="grid grid-cols-7 gap-x-1 gap-y-1.5">
          {week.map((day, i) => (
            <DayCell key={day ?? `blank-${i}`} day={day} today={today} workouts={day ? byDay.get(day) : undefined} />
          ))}
        </ol>
      )}
    </section>
  );
}
