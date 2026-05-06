"use client";

import { useMemo, useState } from "react";
import { BottleSheet } from "@/components/BottleSheet";
import { useBottles } from "@/components/BottlesProvider";
import { dayBucket, dayTotals } from "@/lib/day";
import { getDeviceTz, lastFeedSentence } from "@/lib/format";
import type { BottleInput } from "@/lib/types";

export default function HomePage() {
  const { bottles, loading, error, pending, add } = useBottles();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const tz = getDeviceTz();

  const { ml, min, last } = useMemo(() => {
    const today = dayBucket(new Date(), tz);
    const totals = dayTotals(bottles, today, tz);
    const lastForToday = bottles.find(
      (b) => dayBucket(b.drunk_at, tz) === today,
    );
    return { ml: totals.ml, min: totals.min, last: lastForToday ?? null };
  }, [bottles, tz]);

  async function handleSave(input: BottleInput) {
    setSaving(true);
    try {
      await add(input);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-sm font-medium uppercase tracking-wide text-(--color-ink-soft)">
          Aujourd&apos;hui
        </h1>
      </header>

      <section className="rounded-3xl bg-(--color-surface) p-6 shadow-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-7xl font-bold tabular-nums text-(--color-ink)">
            {ml}
          </span>
          <span className="text-2xl text-(--color-ink-soft)">ml</span>
        </div>
        {min > 0 && (
          <p className="mt-1 text-base text-(--color-ink-soft)">
            + {min} min de tétée
          </p>
        )}
        <p className="mt-2 text-sm text-(--color-ink-soft)">
          {last
            ? lastFeedSentence(last)
            : loading
              ? "Chargement…"
              : "Aucun biberon aujourd'hui"}
        </p>
      </section>

      {pending > 0 && (
        <p className="rounded-2xl bg-(--color-peach) px-4 py-2 text-sm text-(--color-ink)">
          {pending} biberon{pending > 1 ? "s" : ""} en attente de synchro hors-ligne.
        </p>
      )}

      {error && (
        <p className="rounded-2xl bg-(--color-rose) px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-3xl bg-(--color-rose-strong) py-5 text-lg font-semibold text-white shadow-lg shadow-rose-200/60 active:scale-[0.98]"
      >
        <span className="text-2xl leading-none">+</span> Ajouter un biberon
      </button>

      <BottleSheet
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
