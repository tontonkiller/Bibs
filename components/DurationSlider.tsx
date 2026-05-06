"use client";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export function DurationSlider({
  value,
  onChange,
  min = 0,
  max = 60,
  step = 1,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <div className="text-6xl font-bold tabular-nums text-(--color-ink)">
          {value}
        </div>
        <div className="text-sm text-(--color-ink-soft)">min de tétée</div>
      </div>
      <input
        type="range"
        className="pastel"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label="Durée de la tétée en minutes"
      />
      <div className="flex justify-between text-xs text-(--color-ink-soft) tabular-nums">
        <span>{min} min</span>
        <span>{max} min</span>
      </div>
    </div>
  );
}
