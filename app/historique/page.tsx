"use client";

import { useMemo, useState } from "react";
import { BottleSheet } from "@/components/BottleSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useBottles } from "@/components/BottlesProvider";
import { groupByDay } from "@/lib/day";
import {
  feedAmountText,
  formatDayLabel,
  formatTime,
  getDeviceTz,
  kindEmoji,
} from "@/lib/format";
import type { Bottle, NewBottle } from "@/lib/types";

export default function HistoriquePage() {
  const { bottles, loading, edit, remove } = useBottles();
  const tz = getDeviceTz();
  const [editing, setEditing] = useState<Bottle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Bottle | null>(null);
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => groupByDay(bottles, tz), [bottles, tz]);

  async function handleSave(input: NewBottle) {
    if (!editing) return;
    setSaving(true);
    try {
      await edit(editing.id, input);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-sm font-medium uppercase tracking-wide text-(--color-ink-soft)">
          Historique
        </h1>
      </header>

      {loading && (
        <p className="text-sm text-(--color-ink-soft)">Chargement…</p>
      )}

      {!loading && groups.length === 0 && (
        <p className="text-sm text-(--color-ink-soft)">
          Aucun biberon enregistré.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <section
            key={g.day}
            className="rounded-3xl bg-(--color-surface) p-4 shadow-sm"
          >
            <div className="flex items-baseline justify-between px-2">
              <h2 className="font-semibold text-(--color-ink)">
                {formatDayLabel(g.day)}
              </h2>
              <span className="text-sm tabular-nums text-(--color-ink-soft)">
                {g.totalMl} ml
                {g.totalMin > 0 ? ` · ${g.totalMin} min` : ""} ·{" "}
                {g.bottles.length} bib
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-1">
              {g.bottles.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(b)}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-(--color-rose)/30"
                  >
                    <div>
                      <div className="text-base font-medium tabular-nums">
                        <span className="mr-1" aria-hidden>
                          {kindEmoji(b.kind)}
                        </span>
                        {feedAmountText(b)}
                      </div>
                      {b.note && (
                        <div className="text-xs text-(--color-ink-soft)">
                          {b.note}
                        </div>
                      )}
                    </div>
                    <div className="text-sm tabular-nums text-(--color-ink-soft)">
                      {formatTime(b.drunk_at)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <BottleSheet
        open={editing !== null}
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        saving={saving}
      />

      {editing && (
        <button
          type="button"
          onClick={() => {
            setConfirmDelete(editing);
          }}
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-(--color-surface) px-5 py-2 text-sm font-medium text-(--color-rose-strong) shadow-lg"
        >
          Supprimer
        </button>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer ce biberon ?"
        message="Cette action est définitive."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await remove(confirmDelete.id);
          setConfirmDelete(null);
          setEditing(null);
        }}
      />
    </div>
  );
}
