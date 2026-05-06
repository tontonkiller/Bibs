"use client";

import { useState } from "react";
import { useBaby } from "./BabyProvider";
import { BabyForm } from "./BabyForm";
import type { NewBaby } from "@/lib/types";

export function Welcome() {
  const { create } = useBaby();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(input: NewBaby) {
    setSubmitting(true);
    setError(null);
    try {
      await create(input);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de créer le bébé.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 pt-12 pb-12">
      <header>
        <p className="text-xs uppercase tracking-wide text-(--color-ink-soft)">
          Bienvenue
        </p>
        <h1 className="mt-1 text-3xl font-bold text-(--color-ink)">
          Crée ton premier bébé 🍼
        </h1>
        <p className="mt-2 text-sm text-(--color-ink-soft)">
          Le mot de passe sera demandé pour supprimer le bébé. Tu pourras créer d&apos;autres bébés ensuite depuis l&apos;écran Stats.
        </p>
      </header>

      <section className="rounded-3xl bg-(--color-surface) p-6 shadow-sm">
        <BabyForm kind="create" onSubmit={handleCreate} submitting={submitting} />
      </section>

      {error && (
        <p className="rounded-2xl bg-(--color-rose) px-4 py-2 text-sm">{error}</p>
      )}
    </div>
  );
}
