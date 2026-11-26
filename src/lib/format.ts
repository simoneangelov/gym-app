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
