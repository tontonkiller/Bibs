"use client";

import { useState } from "react";
import { useBaby } from "./BabyProvider";
import { UnlockBabyDialog } from "./UnlockBabyDialog";
import type { Baby } from "@/lib/types";

export function SelectBaby() {
  const { babies, unlock } = useBaby();
  const [toUnlock, setToUnlock] = useState<Baby | null>(null);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 pt-12 pb-12">
      <header>
        <p className="text-xs uppercase tracking-wide text-(--color-ink-soft)">
          Bibs
        </p>
        <h1 className="mt-1 text-3xl font-bold text-(--color-ink)">
          Choisis un bébé 🍼
        </h1>
        <p className="mt-2 text-sm text-(--color-ink-soft)">
          Saisis le mot de passe pour débloquer l&apos;accès sur ce téléphone.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        {babies.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setToUnlock(b)}
            className="flex items-center justify-between rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-left"
          >
            <div>
              <div className="font-medium text-(--color-ink)">{b.name}</div>
              <div className="text-xs text-(--color-ink-soft)">
                Né(e) le {b.birthdate}
              </div>
            </div>
            <span aria-hidden>🔒</span>
          </button>
        ))}
      </div>

      <UnlockBabyDialog
        baby={toUnlock}
        onClose={() => setToUnlock(null)}
        onUnlock={async (password) => {
          if (!toUnlock) return false;
          const ok = await unlock(toUnlock.id, password);
          if (ok) setToUnlock(null);
          return ok;
        }}
      />
    </div>
  );
}
