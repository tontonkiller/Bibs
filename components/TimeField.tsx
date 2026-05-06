"use client";

type Props = {
  value: string; // YYYY-MM-DDTHH:mm (local)
  onChange: (next: string) => void;
};

export function TimeField({ value, onChange }: Props) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-(--color-ink-soft)">Heure du biberon</span>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
      />
    </label>
  );
}
