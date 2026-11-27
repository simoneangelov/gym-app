"use client";

import { useId, useState } from "react";
import { formatDate, formatWeight } from "@/lib/format";

export type ProgressPoint = { date: string; value: number };

const W = 320;
const H = 150;
const PAD = { top: 12, right: 10, bottom: 22, left: 40 };

// Days since epoch for a plain YYYY-MM-DD date, so the x axis is spaced by real time.
const dayNum = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 864e5;
};

const compact = (n: number) =>
  n >= 10000 ? `${formatWeight(Math.round(n / 100) / 10)}k` : formatWeight(Math.round(n));

/**
 * Small single-series line chart. Hover with a mouse, or tap / drag sideways with a finger, to read a point.
 * Vertical swipes still scroll the page.
 */
export function ProgressChart({
  title,
  unit,
  points,
}: {
  title: string;
  unit: string;
  points: ProgressPoint[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();

  const xs = points.map((p) => dayNum(p.date));
  const x0 = xs[0];
  const x1 = xs[xs.length - 1];
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  // Start the y axis a little below the lowest value so small gains stay visible.
  const lo = Math.max(0, min - (max - min || max) * 0.25);
  const hi = max === lo ? lo + 1 : max;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const sx = (x: number) => PAD.left + (x1 === x0 ? innerW / 2 : ((x - x0) / (x1 - x0)) * innerW);
  const sy = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;

  const coords = points.map((p, i) => ({ x: sx(xs[i]), y: sy(p.value) }));
  const path = coords.map((c, i) => `${i ? "L" : "M"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const ticks = [lo, (lo + hi) / 2, hi];
  const last = points[points.length - 1];
  const active = hover === null ? null : { ...points[hover], ...coords[hover] };

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(coords[i].x - px) < Math.abs(coords[best].x - px)) best = i;
    }
    setHover(best);
  }

  return (
    <figure className="space-y-1">
      <figcaption id={titleId} className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-zinc-300">{title}</span>
        <span className="tabular-nums text-zinc-400">
          {active ? (
            <>
              {formatDate(active.date)} · <span className="text-zinc-100">{compact(active.value)} {unit}</span>
            </>
          ) : (
            <>
              latest <span className="text-zinc-100">{compact(last.value)} {unit}</span>
            </>
          )}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y select-none"
        role="img"
        aria-labelledby={titleId}
        onPointerMove={onMove}
        onPointerDown={onMove}
        // On touch, keep the tapped point showing after the finger lifts.
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={sy(t)} y2={sy(t)} stroke="#27272a" strokeWidth={1} />
            <text x={PAD.left - 6} y={sy(t)} dy="0.32em" textAnchor="end" className="fill-zinc-500 text-[11px]">
              {compact(t)}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 4} className="fill-zinc-500 text-[11px]">
          {formatDate(points[0].date)}
        </text>
        <text x={W - PAD.right} y={H - 4} textAnchor="end" className="fill-zinc-500 text-[11px]">
          {formatDate(last.date)}
        </text>

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="#52525b"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hover === i ? 5 : 3}
            fill="var(--color-accent)"
            stroke="#18181b"
            strokeWidth={2}
          />
        ))}
      </svg>
      {/* Same numbers as text, for screen readers. */}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <th scope="row">{formatDate(p.date)}</th>
              <td>
                {formatWeight(Math.round(p.value))} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
