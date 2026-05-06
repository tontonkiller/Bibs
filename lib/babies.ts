"use client";

import { getSupabase } from "./supabase";
import type { Baby, BabyEdit, NewBaby } from "./types";

const TABLE = "babies";

export async function listBabies(): Promise<Baby[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select("id, name, birthdate, created_at, updated_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Baby[];
}

export async function createBaby(input: NewBaby): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("create_baby", {
    p_name: input.name,
    p_birthdate: input.birthdate,
    p_password: input.password,
  });
  if (error) throw error;
  return data as string;
}

export async function updateBaby(id: string, patch: BabyEdit): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from(TABLE).update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateBabyPassword(
  id: string,
  newPassword: string,
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.rpc("update_baby_password", {
    p_baby_id: id,
    p_new_password: newPassword,
  });
  if (error) throw error;
}

export async function deleteBaby(
  id: string,
  password: string,
): Promise<boolean> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("delete_baby", {
    p_baby_id: id,
    p_password: password,
  });
  if (error) throw error;
  return Boolean(data);
}
