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

function shiftDate(year: number, month: number, day: number, deltaDays: number) {
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

export type DayTotals = { ml: number; min: number };

export function dayTotals(
  bottles: Bottle[],
  day: string,
  tz: string,
): DayTotals {
  let ml = 0;
  let min = 0;
  for (const b of bottles) {
    if (dayBucket(b.drunk_at, tz) !== day) continue;
    if (b.amount_ml != null) ml += b.amount_ml;
    if (b.duration_min != null) min += b.duration_min;
  }
  return { ml, min };
}

export type DayGroup = {
  day: string;
  totalMl: number;
  totalMin: number;
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
    let totalMl = 0;
    let totalMin = 0;
    for (const b of list) {
      if (b.amount_ml != null) totalMl += b.amount_ml;
      if (b.duration_min != null) totalMin += b.duration_min;
    }
    groups.push({ day, totalMl, totalMin, bottles: list });
  }
  groups.sort((a, b) => b.day.localeCompare(a.day));
  return groups;
}

export type DaySeriesPoint = { day: string; ml: number; min: number };

export function last7Days(
  bottles: Bottle[],
  today: Date,
  tz: string,
): DaySeriesPoint[] {
  const todayBucket = dayBucket(today, tz);
  const [y, m, d] = todayBucket.split("-").map((s) => parseInt(s, 10));
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const shifted = shiftDate(y, m, d, -i);
    days.push(isoDate(shifted.year, shifted.month, shifted.day));
  }
  const totals = new Map<string, DayTotals>(
    days.map((day) => [day, { ml: 0, min: 0 }]),
  );
  for (const b of bottles) {
    const key = dayBucket(b.drunk_at, tz);
    const t = totals.get(key);
    if (!t) continue;
    if (b.amount_ml != null) t.ml += b.amount_ml;
    if (b.duration_min != null) t.min += b.duration_min;
  }
  return days.map((day) => {
    const t = totals.get(day)!;
    return { day, ml: t.ml, min: t.min };
  });
}
