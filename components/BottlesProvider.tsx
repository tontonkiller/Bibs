"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createBottle,
  listBottles,
  removeBottle,
  updateBottle,
} from "@/lib/bottles";
import { drainQueue, pendingCount } from "@/lib/offlineQueue";
import type { Bottle, BottlePatch, NewBottle } from "@/lib/types";

type Ctx = {
  bottles: Bottle[];
  loading: boolean;
  error: string | null;
  pending: number;
  refresh: () => Promise<void>;
  add: (input: NewBottle) => Promise<void>;
  edit: (id: string, patch: BottlePatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const BottlesContext = createContext<Ctx | null>(null);

export function BottlesProvider({ children }: { children: React.ReactNode }) {
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listBottles();
      setBottles(list);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible de charger les biberons.",
      );
    } finally {
      setLoading(false);
      setPending(await pendingCount());
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onOnline = async () => {
      const result = await drainQueue();
      if (result.ok > 0) await refresh();
      else setPending(await pendingCount());
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  const add = useCallback(
    async (input: NewBottle) => {
      const created = await createBottle(input);
      if (created) {
        setBottles((prev) =>
          [created, ...prev].sort((a, b) =>
            b.drunk_at.localeCompare(a.drunk_at),
          ),
        );
      }
      setPending(await pendingCount());
    },
    [],
  );

  const edit = useCallback(
    async (id: string, patch: BottlePatch) => {
      const updated = await updateBottle(id, patch);
      if (updated) {
        setBottles((prev) =>
          prev
            .map((b) => (b.id === id ? updated : b))
            .sort((a, b) => b.drunk_at.localeCompare(a.drunk_at)),
        );
      }
      setPending(await pendingCount());
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await removeBottle(id);
    setBottles((prev) => prev.filter((b) => b.id !== id));
    setPending(await pendingCount());
  }, []);

  return (
    <BottlesContext.Provider
      value={{ bottles, loading, error, pending, refresh, add, edit, remove }}
    >
      {children}
    </BottlesContext.Provider>
  );
}

export function useBottles(): Ctx {
  const ctx = useContext(BottlesContext);
  if (!ctx) throw new Error("useBottles doit être utilisé dans BottlesProvider");
  return ctx;
}
