import type { Bottle } from "./types";

export const DAY_BOUNDARY_HOUR = 6;

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function zonedParts(date: Date, tz: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)!.value, 10);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // hour can be "24" in some runtimes; normalize.
    hour: get("hour") % 24,
    minute: get("minute"),
  };
}

function isoDate(year: number, month: number, day: number): string {
  return (
    String(year).padStart(4, "0") +
    "-" +
    String(month).padStart(2, "0") +
    "-" +
    String(day).padStart(2, "0")
  );
}

function shiftDate(year: number, month: number, day: number, deltaDays: number): {
  year: number;
  month: number;
  day: number;
} {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function dayBucket(date: Date | string, tz: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const { year, month, day, hour } = zonedParts(d, tz);
  if (hour < DAY_BOUNDARY_HOUR) {
    const prev = shiftDate(year, month, day, -1);
    return isoDate(prev.year, prev.month, prev.day);
  }
  return isoDate(year, month, day);
}

export function totalForDay(
  bottles: Bottle[],
  day: string,
  tz: string,
): number {
  let total = 0;
  for (const b of bottles) {
    if (dayBucket(b.drunk_at, tz) === day) total += b.amount_ml;
  }
  return total;
}

export type DayGroup = {
  day: string;
  totalMl: number;
  bottles: Bottle[];
};

export function groupByDay(bottles: Bottle[], tz: string): DayGroup[] {
  const map = new Map<string, Bottle[]>();
  for (const b of bottles) {
    const key = dayBucket(b.drunk_at, tz);
    const arr = map.get(key);
    if (arr) arr.push(b);
    else map.set(key, [b]);
  }
  const groups: DayGroup[] = [];
  for (const [day, list] of map) {
    list.sort((a, b) => b.drunk_at.localeCompare(a.drunk_at));
    const totalMl = list.reduce((s, b) => s + b.amount_ml, 0);
    groups.push({ day, totalMl, bottles: list });
  }
  groups.sort((a, b) => b.day.localeCompare(a.day));
  return groups;
}

export function last7Days(
  bottles: Bottle[],
  today: Date,
  tz: string,
): { day: string; totalMl: number }[] {
  const todayBucket = dayBucket(today, tz);
  const [y, m, d] = todayBucket.split("-").map((s) => parseInt(s, 10));
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const shifted = shiftDate(y, m, d, -i);
    days.push(isoDate(shifted.year, shifted.month, shifted.day));
  }
  const totals = new Map(days.map((day) => [day, 0]));
  for (const b of bottles) {
    const key = dayBucket(b.drunk_at, tz);
    if (totals.has(key)) totals.set(key, totals.get(key)! + b.amount_ml);
  }
  return days.map((day) => ({ day, totalMl: totals.get(day) ?? 0 }));
}
