"use client";

import type { FeedKind } from "@/lib/types";

const OPTIONS: { kind: FeedKind; label: string; emoji: string }[] = [
  { kind: "formula", label: "Poudre", emoji: "🍼" },
  { kind: "breast", label: "Sein", emoji: "🤱" },
  { kind: "pumped", label: "Tiré", emoji: "🥛" },
];

type Props = {
  value: FeedKind;
  onChange: (next: FeedKind) => void;
};

export function KindToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Type de biberon"
      className="grid grid-cols-3 gap-1 rounded-2xl bg-(--color-bg) p-1"
    >
      {OPTIONS.map((opt) => {
        const active = opt.kind === value;
        return (
          <button
            key={opt.kind}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.kind)}
            className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-sm transition ${
              active
                ? "bg-(--color-surface) font-semibold text-(--color-ink) shadow-sm"
                : "text-(--color-ink-soft)"
            }`}
          >
            <span aria-hidden>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
