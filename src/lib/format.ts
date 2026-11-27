export function formatDate(isoDate: string) {
  // performed_on is a plain date (YYYY-MM-DD); parse as local, not UTC.
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: new Date().getFullYear() === y ? undefined : "numeric",
  });
}

export function formatWeight(w: number | string) {
  // Round to 2 decimals first so kg↔lb conversions like 59.99999 show as 60.
  const n = Math.round(Number(w) * 100) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
}

/** A Date's calendar day in local time as YYYY-MM-DD (toISOString would shift it to UTC). */
export function localISODate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The seven days (YYYY-MM-DD) of the Sunday-to-Saturday week containing `today`. */
export function weekDays(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  const sunday = new Date(y, m - 1, d - new Date(y, m - 1, d).getDay());
  return Array.from({ length: 7 }, (_, i) =>
    localISODate(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i)),
  );
}

/** The month containing `today` as Sunday-to-Saturday rows; cells outside the month are null. */
export function monthWeeks(today: string): (string | null)[][] {
  const [y, m] = today.split("-").map(Number);
  const cells: (string | null)[] = Array(new Date(y, m - 1, 1).getDay()).fill(null);
  const daysInMonth = new Date(y, m, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) cells.push(localISODate(new Date(y, m - 1, d)));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

/** How many months the expanded calendar scrolls back through, including this one. */
export const CALENDAR_MONTHS = 12;
/** How many months after this one the expanded calendar shows. */
export const CALENDAR_MONTHS_AHEAD = 1;

/**
 * The first day (YYYY-MM-01) of the `count` months ending with the one containing `today`,
 * plus `ahead` months after it, oldest first.
 */
export function recentMonths(today: string, count: number, ahead = 0) {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: count + ahead }, (_, i) =>
    localISODate(new Date(y, m - 1 - (count - 1 - i), 1)),
  );
}
