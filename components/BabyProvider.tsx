"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createBaby,
  deleteBaby,
  listBabies,
  updateBaby,
  verifyBabyPassword,
  type UpdateBabyChanges,
} from "@/lib/babies";
import type { Baby, NewBaby } from "@/lib/types";

const CURRENT_KEY = "bibs.currentBabyId";
const UNLOCKED_KEY = "bibs.unlockedBabies";

function loadUnlocked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(UNLOCKED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveUnlocked(set: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...set]));
}

type Ctx = {
  babies: Baby[];
  current: Baby | null;
  unlocked: Set<string>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Try to unlock a baby with its password. Switches to it on success. */
  unlock: (babyId: string, password: string) => Promise<boolean>;
  /** Switch to an already-unlocked baby. No-op if not unlocked. */
  select: (babyId: string) => void;
  create: (input: NewBaby) => Promise<Baby>;
  /** Verify currentPassword and apply changes (name, birthdate, newPassword). */
  edit: (
    babyId: string,
    currentPassword: string,
    changes: UpdateBabyChanges,
  ) => Promise<boolean>;
  remove: (id: string, password: string) => Promise<boolean>;
};

const BabyContext = createContext<Ctx | null>(null);

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(() => loadUnlocked());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listBabies();
      setBabies(list);
      // Pick a sensible "current": stored if still valid AND unlocked,
      // else the first unlocked baby, else null.
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(CURRENT_KEY)
          : null;
      const unlockedNow = loadUnlocked();
      setUnlocked(unlockedNow);
      if (
        stored &&
        list.some((b) => b.id === stored) &&
        unlockedNow.has(stored)
      ) {
        setCurrentId(stored);
      } else {
        const firstUnlocked = list.find((b) => unlockedNow.has(b.id));
        setCurrentId(firstUnlocked?.id ?? null);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible de charger les bébés.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentId) window.localStorage.setItem(CURRENT_KEY, currentId);
  }, [currentId]);

  const select = useCallback(
    (babyId: string) => {
      if (!unlocked.has(babyId)) return;
      setCurrentId(babyId);
    },
    [unlocked],
  );

  const unlock = useCallback(async (babyId: string, password: string) => {
    const ok = await verifyBabyPassword(babyId, password);
    if (!ok) return false;
    setUnlocked((prev) => {
      const next = new Set(prev);
      next.add(babyId);
      saveUnlocked(next);
      return next;
    });
    setCurrentId(babyId);
    return true;
  }, []);

  const create = useCallback(async (input: NewBaby) => {
    const id = await createBaby(input);
    const list = await listBabies();
    setBabies(list);
    setUnlocked((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveUnlocked(next);
      return next;
    });
    setCurrentId(id);
    const created = list.find((b) => b.id === id);
    if (!created) throw new Error("Bébé créé introuvable.");
    return created;
  }, []);

  const edit = useCallback(
    async (
      babyId: string,
      currentPassword: string,
      changes: UpdateBabyChanges,
    ) => {
      const ok = await updateBaby(babyId, currentPassword, changes);
      if (ok) {
        const list = await listBabies();
        setBabies(list);
      }
      return ok;
    },
    [],
  );

  const remove = useCallback(
    async (id: string, password: string) => {
      const ok = await deleteBaby(id, password);
      if (!ok) return false;
      const list = await listBabies();
      setBabies(list);
      setUnlocked((prev) => {
        const next = new Set(prev);
        next.delete(id);
        saveUnlocked(next);
        return next;
      });
      if (currentId === id) {
        const fallback = list.find((b) => unlocked.has(b.id) && b.id !== id);
        setCurrentId(fallback?.id ?? null);
      }
      return true;
    },
    [currentId, unlocked],
  );

  const current = babies.find((b) => b.id === currentId) ?? null;

  return (
    <BabyContext.Provider
      value={{
        babies,
        current,
        unlocked,
        loading,
        error,
        refresh,
        unlock,
        select,
        create,
        edit,
        remove,
      }}
    >
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby(): Ctx {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error("useBaby doit être utilisé dans BabyProvider");
  return ctx;
}
