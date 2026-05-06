"use client";

import { useEffect, useState } from "react";
import { BottleSlider } from "./BottleSlider";
import { DurationSlider } from "./DurationSlider";
import { KindToggle } from "./KindToggle";
import { TimeField } from "./TimeField";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/format";
import type { Bottle, BottleInput, FeedKind } from "@/lib/types";

type Props = {
  open: boolean;
  initial?: Bottle | null;
  onClose: () => void;
  onSave: (input: BottleInput) => Promise<void> | void;
  saving?: boolean;
};

export function BottleSheet({ open, initial, onClose, onSave, saving }: Props) {
  const [kind, setKind] = useState<FeedKind>("formula");
  const [amount, setAmount] = useState(90);
  const [duration, setDuration] = useState(15);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setKind(initial.kind);
      setAmount(initial.amount_ml ?? 90);
      setDuration(initial.duration_min ?? 15);
      setTime(toLocalInputValue(new Date(initial.drunk_at)));
      setNote(initial.note ?? "");
    } else {
      setKind("formula");
      setAmount(90);
      setDuration(15);
      setTime(toLocalInputValue(new Date()));
      setNote("");
    }
  }, [open, initial]);

  if (!open) return null;

  const isBreast = kind === "breast";
  const title = initial ? "Modifier" : "Nouveau biberon";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-(--color-surface) p-6 shadow-xl sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-(--color-ink-soft) hover:bg-(--color-rose)/40"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <KindToggle value={kind} onChange={setKind} />

        <div className="mt-5">
          {isBreast ? (
            <DurationSlider value={duration} onChange={setDuration} />
          ) : (
            <BottleSlider value={amount} onChange={setAmount} />
          )}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <TimeField value={time} onChange={setTime} />
          <label className="flex flex-col gap-1">
            <span className="text-sm text-(--color-ink-soft)">
              Note (optionnel)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Réveil difficile, vomi, etc."
              className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={saving || !time}
          onClick={() =>
            onSave({
              kind,
              amount_ml: isBreast ? null : amount,
              duration_min: isBreast ? duration : null,
              drunk_at: fromLocalInputValue(time),
              note: note.trim() || null,
            })
          }
          className="mt-6 w-full rounded-2xl bg-(--color-rose-strong) py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
