"use client";

import { getSupabase } from "./supabase";
import type { Bottle, BottlePatch, NewBottle } from "./types";
import { enqueue } from "./offlineQueue";

const TABLE = "bottles";

export async function listBottles(): Promise<Bottle[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .order("drunk_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as Bottle[];
}

export async function createBottle(input: NewBottle): Promise<Bottle | null> {
  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from(TABLE)
      .insert({
        drunk_at: input.drunk_at,
        amount_ml: input.amount_ml,
        note: input.note ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Bottle;
  } catch (e) {
    if (isNetworkError(e)) {
      await enqueue({ kind: "create", payload: input });
      return null;
    }
    throw e;
  }
}

export async function updateBottle(
  id: string,
  patch: BottlePatch,
): Promise<Bottle | null> {
  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from(TABLE)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Bottle;
  } catch (e) {
    if (isNetworkError(e)) {
      await enqueue({ kind: "update", id, payload: patch });
      return null;
    }
    throw e;
  }
}

export async function removeBottle(id: string): Promise<void> {
  const sb = getSupabase();
  try {
    const { error } = await sb.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    if (isNetworkError(e)) {
      await enqueue({ kind: "delete", id });
      return;
    }
    throw e;
  }
}

function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (e instanceof TypeError) return true;
  const msg = (e as { message?: string })?.message?.toLowerCase() ?? "";
  return (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("load failed")
  );
}
