"use client";

import { getSupabase } from "./supabase";
import type { Baby, NewBaby } from "./types";

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

export async function verifyBabyPassword(
  babyId: string,
  password: string,
): Promise<boolean> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("verify_baby_password", {
    p_baby_id: babyId,
    p_password: password,
  });
  if (error) throw error;
  return Boolean(data);
}

export type UpdateBabyChanges = {
  name?: string;
  birthdate?: string;
  newPassword?: string;
};

export async function updateBaby(
  babyId: string,
  currentPassword: string,
  changes: UpdateBabyChanges,
): Promise<boolean> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("update_baby", {
    p_baby_id: babyId,
    p_current_password: currentPassword,
    p_name: changes.name ?? null,
    p_birthdate: changes.birthdate ?? null,
    p_new_password: changes.newPassword ?? null,
  });
  if (error) throw error;
  return Boolean(data);
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
