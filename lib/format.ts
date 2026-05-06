import type { Bottle, FeedKind } from "./types";

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
  const [y, m, d] = dayKey.split("-").map((s) => parseInt(s, 10));
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const label = DATE_LONG_FMT.format(date);
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

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function fromLocalInputValue(local: string): string {
  const [datePart, timePart] = local.split("T");
  const [y, m, d] = datePart.split("-").map((s) => parseInt(s, 10));
  const [hh, mm] = timePart.split(":").map((s) => parseInt(s, 10));
  const date = new Date(y, m - 1, d, hh, mm, 0, 0);
  return date.toISOString();
}

const KIND_EMOJI: Record<FeedKind, string> = {
  formula: "🍼",
  breast: "🤱",
  pumped: "🥛",
};

export function kindEmoji(kind: FeedKind): string {
  return KIND_EMOJI[kind];
}

// Compact display: "90 ml", "15 min", "90 ml" depending on kind.
export function feedAmountText(b: Bottle): string {
  if (b.kind === "breast") return `${b.duration_min ?? 0} min`;
  return `${b.amount_ml ?? 0} ml`;
}

// "Dernier : 90 ml à 03h12" or "Dernière tétée : 15 min à 03h12"
export function lastFeedSentence(b: Bottle): string {
  const time = formatTime(b.drunk_at);
  if (b.kind === "breast") {
    return `Dernière tétée : ${b.duration_min ?? 0} min à ${time}`;
  }
  const noun = b.kind === "pumped" ? "biberon (tiré)" : "biberon";
  return `Dernier ${noun} : ${b.amount_ml ?? 0} ml à ${time}`;
}
