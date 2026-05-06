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
  updateBabyPassword,
} from "@/lib/babies";
import type { Baby, BabyEdit, NewBaby } from "@/lib/types";

const STORAGE_KEY = "bibs.currentBabyId";

type Ctx = {
  babies: Baby[];
  current: Baby | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  select: (babyId: string) => void;
  create: (input: NewBaby) => Promise<Baby>;
  edit: (id: string, patch: BabyEdit) => Promise<void>;
  changePassword: (id: string, newPassword: string) => Promise<void>;
  remove: (id: string, password: string) => Promise<boolean>;
};

const BabyContext = createContext<Ctx | null>(null);

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listBabies();
      setBabies(list);
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (stored && list.some((b) => b.id === stored)) {
        setCurrentId(stored);
      } else if (list.length > 0) {
        setCurrentId(list[0].id);
      } else {
        setCurrentId(null);
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
    if (currentId) window.localStorage.setItem(STORAGE_KEY, currentId);
  }, [currentId]);

  const select = useCallback((babyId: string) => {
    setCurrentId(babyId);
  }, []);

  const create = useCallback(
    async (input: NewBaby) => {
      const id = await createBaby(input);
      const list = await listBabies();
      setBabies(list);
      setCurrentId(id);
      const created = list.find((b) => b.id === id);
      if (!created) throw new Error("Bébé créé introuvable.");
      return created;
    },
    [],
  );

  const edit = useCallback(async (id: string, patch: BabyEdit) => {
    await updateBaby(id, patch);
    const list = await listBabies();
    setBabies(list);
  }, []);

  const changePassword = useCallback(
    async (id: string, newPassword: string) => {
      await updateBabyPassword(id, newPassword);
    },
    [],
  );

  const remove = useCallback(
    async (id: string, password: string) => {
      const ok = await deleteBaby(id, password);
      if (!ok) return false;
      const list = await listBabies();
      setBabies(list);
      if (currentId === id) {
        setCurrentId(list.length > 0 ? list[0].id : null);
      }
      return true;
    },
    [currentId],
  );

  const current = babies.find((b) => b.id === currentId) ?? null;

  return (
    <BabyContext.Provider
      value={{
        babies,
        current,
        loading,
        error,
        refresh,
        select,
        create,
        edit,
        changePassword,
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
