"use client";

import { useState } from "react";
import { useBaby } from "./BabyProvider";
import { BabyForm } from "./BabyForm";
import { DeleteBabyDialog } from "./DeleteBabyDialog";
import type { Baby, BabyEdit, NewBaby } from "@/lib/types";

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; baby: Baby };

export function BabyMenu() {
  const { babies, current, select, create, edit, changePassword, remove } =
    useBaby();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Baby | null>(null);

  function openSheet() {
    setMode({ kind: "list" });
    setError(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setMode({ kind: "list" });
    setError(null);
  }

  async function handleCreate(input: NewBaby) {
    setSubmitting(true);
    setError(null);
    try {
      await create(input);
      setMode({ kind: "list" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(
    patch: BabyEdit,
    pwd: { newPassword: string } | null,
  ) {
    if (mode.kind !== "edit") return;
    setSubmitting(true);
    setError(null);
    try {
      if (Object.keys(patch).length > 0) await edit(mode.baby.id, patch);
      if (pwd) await changePassword(mode.baby.id, pwd.newPassword);
      setMode({ kind: "list" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="flex items-center gap-1 rounded-2xl bg-(--color-rose) px-3 py-2 text-sm font-medium text-(--color-ink)"
        aria-label="Changer de bébé"
      >
        <span className="truncate max-w-[8rem]">
          {current?.name ?? "Aucun bébé"}
        </span>
        <span aria-hidden>▾</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-(--color-surface) p-6 shadow-xl sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {mode.kind === "create"
                  ? "Nouveau bébé"
                  : mode.kind === "edit"
                    ? `Modifier ${mode.baby.name}`
                    : "Bébés"}
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-2 text-(--color-ink-soft) hover:bg-(--color-rose)/40"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {error && (
              <p className="mb-3 rounded-2xl bg-(--color-rose) px-4 py-2 text-sm">
                {error}
              </p>
            )}

            {mode.kind === "list" && (
              <div className="flex flex-col gap-2">
                {babies.map((b) => {
                  const active = current?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${
                        active
                          ? "border-(--color-rose-strong) bg-(--color-rose)/40"
                          : "border-(--color-line)"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          select(b.id);
                          close();
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium text-(--color-ink)">
                          {b.name}
                        </div>
                        <div className="text-xs text-(--color-ink-soft)">
                          Né(e) le {b.birthdate}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode({ kind: "edit", baby: b })}
                        className="rounded-full p-2 text-(--color-ink-soft) hover:bg-(--color-rose)/40"
                        aria-label="Modifier"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(b)}
                        className="rounded-full p-2 text-(--color-rose-strong) hover:bg-(--color-rose)/40"
                        aria-label="Supprimer"
                      >
                        🗑
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setMode({ kind: "create" })}
                  className="mt-2 rounded-2xl bg-(--color-rose-strong) px-4 py-3 font-semibold text-white"
                >
                  + Nouveau bébé
                </button>
              </div>
            )}

            {mode.kind === "create" && (
              <BabyForm
                kind="create"
                onSubmit={handleCreate}
                submitting={submitting}
                onCancel={() => setMode({ kind: "list" })}
              />
            )}

            {mode.kind === "edit" && (
              <BabyForm
                kind="edit"
                baby={mode.baby}
                onSubmit={handleEdit}
                submitting={submitting}
                onCancel={() => setMode({ kind: "list" })}
              />
            )}
          </div>
        </div>
      )}

      <DeleteBabyDialog
        baby={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async (password) => {
          if (!toDelete) return false;
          const ok = await remove(toDelete.id, password);
          if (ok) setToDelete(null);
          return ok;
        }}
      />
    </>
  );
}
