"use client";

import { openDB, type IDBPDatabase } from "idb";
import { getSupabase } from "./supabase";
import type { BottlePatch, NewBottle } from "./types";

type CreateOp = { kind: "create"; payload: NewBottle };
type UpdateOp = { kind: "update"; id: string; payload: BottlePatch };
type DeleteOp = { kind: "delete"; id: string };
export type QueuedOp = CreateOp | UpdateOp | DeleteOp;

type StoredOp = QueuedOp & { id?: number; queuedAt: string };

const DB_NAME = "bibs";
const STORE = "queue";
const VERSION = 1;

async function db(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export async function enqueue(op: QueuedOp): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const d = await db();
  await d.add(STORE, { ...op, queuedAt: new Date().toISOString() });
}

export async function pendingCount(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const d = await db();
  return d.count(STORE);
}

export async function drainQueue(): Promise<{ ok: number; failed: number }> {
  if (typeof indexedDB === "undefined") return { ok: 0, failed: 0 };
  const d = await db();
  const tx = d.transaction(STORE, "readwrite");
  const all = (await tx.store.getAll()) as StoredOp[];
  await tx.done;

  const sb = getSupabase();
  let ok = 0;
  let failed = 0;
  for (const op of all) {
    try {
      if (op.kind === "create") {
        const { error } = await sb.from("bottles").insert({
          baby_id: op.payload.baby_id,
          drunk_at: op.payload.drunk_at,
          kind: op.payload.kind,
          amount_ml: op.payload.amount_ml,
          duration_min: op.payload.duration_min,
          note: op.payload.note ?? null,
        });
        if (error) throw error;
      } else if (op.kind === "update") {
        const { error } = await sb
          .from("bottles")
          .update(op.payload)
          .eq("id", op.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("bottles").delete().eq("id", op.id);
        if (error) throw error;
      }
      const txDel = d.transaction(STORE, "readwrite");
      await txDel.store.delete(op.id!);
      await txDel.done;
      ok++;
    } catch {
      failed++;
    }
  }
  return { ok, failed };
}
