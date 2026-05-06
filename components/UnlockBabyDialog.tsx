"use client";

import { useEffect, useState } from "react";
import type { Baby } from "@/lib/types";

type Props = {
  baby: Baby | null;
  onClose: () => void;
  onUnlock: (password: string) => Promise<boolean>;
};

export function UnlockBabyDialog({ baby, onClose, onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (baby) {
      setPassword("");
      setError(null);
      setBusy(false);
    }
  }, [baby]);

  if (!baby) return null;

  async function submit() {
    if (!baby) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onUnlock(password);
      if (!ok) setError("Mot de passe incorrect.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-3xl bg-(--color-surface) p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-(--color-ink)">
          Mot de passe pour {baby.name}
        </h2>
        <p className="mt-2 text-sm text-(--color-ink-soft)">
          Première utilisation sur ce téléphone. Une fois validé, l&apos;accès reste
          mémorisé localement.
        </p>
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-sm text-(--color-ink-soft)">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
          />
        </label>
        {error && (
          <p className="mt-3 rounded-2xl bg-(--color-rose) px-4 py-2 text-sm">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 font-medium text-(--color-ink) disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || password.length === 0}
            className="flex-1 rounded-2xl bg-(--color-rose-strong) px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Vérification…" : "Débloquer"}
          </button>
        </div>
      </div>
    </div>
  );
}
