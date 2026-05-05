"use client";

import { useEffect, useState } from "react";
import { BottleSlider } from "./BottleSlider";
import { TimeField } from "./TimeField";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/format";
import type { Bottle, NewBottle } from "@/lib/types";

type Props = {
  open: boolean;
  initial?: Bottle | null;
  onClose: () => void;
  onSave: (input: NewBottle) => Promise<void> | void;
  saving?: boolean;
};

export function BottleSheet({ open, initial, onClose, onSave, saving }: Props) {
  const [amount, setAmount] = useState(90);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setAmount(initial.amount_ml);
      setTime(toLocalInputValue(new Date(initial.drunk_at)));
      setNote(initial.note ?? "");
    } else {
      setAmount(90);
      setTime(toLocalInputValue(new Date()));
      setNote("");
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-(--color-surface) p-6 shadow-xl sm:rounded-3xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {initial ? "Modifier le biberon" : "Nouveau biberon"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-(--color-ink-soft) hover:bg-(--color-rose)/40"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <BottleSlider value={amount} onChange={setAmount} />
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
              amount_ml: amount,
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
