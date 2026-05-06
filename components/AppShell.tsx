"use client";

import { useBaby } from "./BabyProvider";
import { BottomNav } from "./BottomNav";
import { SelectBaby } from "./SelectBaby";
import { Welcome } from "./Welcome";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { babies, current, loading, error } = useBaby();

  if (loading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-sm text-(--color-ink-soft)">
        Chargement…
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12">
        <p className="rounded-2xl bg-(--color-rose) px-4 py-2 text-sm">
          {error}
        </p>
      </main>
    );
  }

  if (babies.length === 0) {
    return <Welcome />;
  }

  if (!current) {
    return <SelectBaby />;
  }

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-6 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
