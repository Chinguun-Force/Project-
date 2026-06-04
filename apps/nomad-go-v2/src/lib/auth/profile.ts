import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/auth/roles";

/** Canonical identity table (RLS + multi-tenant). */
export const PROFILES_TABLE = "profiles" as const;

export type ProfileRow = {
  id: string;
  role: string;
  full_name: string | null;
  tenant_id: string | null;
};

export type ProfileRoleFields = Pick<ProfileRow, "role" | "tenant_id">;

export async function fetchProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select("id, role, full_name, tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}

export async function fetchProfileRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const profile = await fetchProfileByUserId(supabase, userId);
  return profile?.role ?? null;
}

/** Maps legacy `user` role to `tourist` for profiles writes. */
export function toProfileRole(role: string): AppRole | "tourist" {
  if (role === "user") return "tourist";
  if (
    role === "admin" ||
    role === "moderator" ||
    role === "guide" ||
    role === "tourist"
  ) {
    return role;
  }
  return "tourist";
}

/** Keeps legacy `users.role` in sync during cutover (`tourist` → `user`). */
export function toLegacyUserRole(role: string): string {
  if (role === "tourist") return "user";
  return role;
}

export function tenantIdForRole(
  role: string,
  tenantId: string | null,
): string | null {
  if (role === "admin" || role === "tourist" || role === "user") return null;
  if (role === "moderator" || role === "guide") return tenantId;
  return null;
}
