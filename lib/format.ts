const TIME_FMT = new Intl.DateTimeFormat("fr-CA", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_LONG_FMT = new Intl.DateTimeFormat("fr-CA", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatTime(iso: string): string {
  return TIME_FMT.format(new Date(iso)).replace(":", "h");
}

export function formatDayLabel(dayKey: string): string {
  // dayKey is YYYY-MM-DD already in target tz; build a Date at noon to avoid TZ drift
  const [y, m, d] = dayKey.split("-").map((s) => parseInt(s, 10));
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const label = DATE_LONG_FMT.format(date);
  // Capitalize first letter of weekday
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatMl(ml: number): string {
  return `${ml} ml`;
}

export function getDeviceTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// Convert a Date to the value expected by <input type="datetime-local">
// (YYYY-MM-DDTHH:mm in local tz, no seconds).
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// Parse a "YYYY-MM-DDTHH:mm" local-time string back into an ISO string in UTC.
export function fromLocalInputValue(local: string): string {
  // Treat as local time of the device.
  const [datePart, timePart] = local.split("T");
  const [y, m, d] = datePart.split("-").map((s) => parseInt(s, 10));
  const [hh, mm] = timePart.split(":").map((s) => parseInt(s, 10));
  const date = new Date(y, m - 1, d, hh, mm, 0, 0);
  return date.toISOString();
}
