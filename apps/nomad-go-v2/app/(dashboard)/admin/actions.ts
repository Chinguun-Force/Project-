"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  tenantIdForRole,
  toLegacyUserRole,
  toProfileRole,
} from "@/lib/auth/profile";

const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
};

export async function getUsers() {
  const supabase = getAdminSupabase();

  const [{ data: profiles, error: profilesError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role, tenant_id, tenants(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("id, email, avatar_url, current_xp, role")
        .order("created_at", { ascending: false }),
    ]);

  if (profilesError) throw new Error(profilesError.message);
  if (usersError) throw new Error(usersError.message);

  const usersById = new Map((users ?? []).map((u) => [u.id, u]));

  return (profiles ?? []).map((p) => {
    const legacy = usersById.get(p.id);
    const tenantJoin = p.tenants as { name: string } | { name: string }[] | null;
    const tenantName = Array.isArray(tenantJoin)
      ? tenantJoin[0]?.name
      : tenantJoin?.name;

    return {
      id: p.id,
      full_name: p.full_name ?? null,
      email: legacy?.email ?? null,
      role: p.role,
      tenant_id: p.tenant_id,
      tenant_name: tenantName ?? null,
      avatar_url: legacy?.avatar_url ?? null,
      current_xp: legacy?.current_xp ?? 0,
    };
  });
}

export async function updateUserRole(
  userId: string,
  newRole: string,
  tenantId?: string | null,
) {
  const supabase = getAdminSupabase();
  const profileRole = toProfileRole(newRole);
  const resolvedTenantId = tenantIdForRole(profileRole, tenantId ?? null);

  if (profileRole === "moderator" && !resolvedTenantId) {
    throw new Error(
      "Company roles (moderator) require a travel company (tenant). Assign one in the Companies tab first.",
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: profileRole,
      tenant_id: resolvedTenantId,
    })
    .eq("id", userId);

  if (profileError) throw new Error(profileError.message);

  const { error: userError } = await supabase
    .from("users")
    .update({ role: toLegacyUserRole(profileRole) })
    .eq("id", userId);

  if (userError) throw new Error(userError.message);

  revalidatePath("/admin" as any);
  return { success: true };
}

export async function getTenants() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, name, description, logo_url, contact_email, website, location, created_at, updated_at",
    )
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type TenantWithDetails = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  website: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  moderators: { id: string; full_name: string | null; email: string | null }[];
  published_trip_count: number;
  guide_count: number;
};

/** All travel companies with assigned moderators and marketplace stats (admin view). */
export async function getTenantsWithDetails(): Promise<TenantWithDetails[]> {
  const supabase = getAdminSupabase();

  const [tenantsRes, profilesRes, tripsRes, usersRes] = await Promise.all([
    supabase
      .from("tenants")
      .select(
        "id, name, description, logo_url, contact_email, website, location, created_at, updated_at",
      )
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, role, tenant_id")
      .in("role", ["moderator", "guide"]),
    supabase.from("trips").select("tenant_id, is_published"),
    supabase.from("users").select("id, email"),
  ]);

  if (tenantsRes.error) throw new Error(tenantsRes.error.message);
  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (tripsRes.error) throw new Error(tripsRes.error.message);
  if (usersRes.error) throw new Error(usersRes.error.message);

  const emailById = new Map((usersRes.data ?? []).map((u) => [u.id, u.email]));
  const profiles = profilesRes.data ?? [];
  const trips = tripsRes.data ?? [];

  return (tenantsRes.data ?? []).map((tenant) => {
    const moderators = profiles
      .filter((p) => p.tenant_id === tenant.id && p.role === "moderator")
      .map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: emailById.get(p.id) ?? null,
      }));

    const published_trip_count = trips.filter(
      (t) => t.tenant_id === tenant.id && t.is_published,
    ).length;

    const guide_count = profiles.filter(
      (p) => p.tenant_id === tenant.id && p.role === "guide",
    ).length;

    return {
      ...tenant,
      moderators,
      published_trip_count,
      guide_count,
    };
  });
}

export async function createTenant(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Company name is required");

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .insert({ name: trimmed })
    .select("id, name")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin" as any);
  return data;
}

export async function assignModeratorToTenant(
  profileId: string,
  tenantId: string,
) {
  const supabase = getAdminSupabase();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantError) throw new Error(tenantError.message);
  if (!tenant) throw new Error("Travel company not found");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "moderator", tenant_id: tenantId })
    .eq("id", profileId);

  if (profileError) throw new Error(profileError.message);

  const { error: userError } = await supabase
    .from("users")
    .update({ role: "moderator" })
    .eq("id", profileId);

  if (userError) throw new Error(userError.message);

  revalidatePath("/admin" as any);
  return { success: true };
}

/** Live departures (rooms) across all tenants — replaces legacy sessions admin view. */
export async function getAdminDepartures() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      `
      id,
      room_code,
      status,
      created_at,
      guide_id,
      trips ( title ),
      tenants ( name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const guideIds = [
    ...new Set((data ?? []).map((r) => r.guide_id).filter(Boolean)),
  ] as string[];
  const guideNames: Record<string, string> = {};
  if (guideIds.length > 0) {
    const { data: guides } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", guideIds);
    for (const g of guides ?? []) {
      guideNames[g.id] = g.full_name ?? "Guide";
    }
  }

  return (data ?? []).map((row) => {
    const tripRaw = row.trips as { title?: string } | { title?: string }[] | null;
    const trip = Array.isArray(tripRaw) ? tripRaw[0] : tripRaw;
    const tenantRaw = row.tenants as { name?: string } | { name?: string }[] | null;
    const tenant = Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw;

    return {
      id: row.id,
      room_code: row.room_code,
      status: row.status,
      created_at: row.created_at,
      trip_title: trip?.title ?? "—",
      company_name: tenant?.name ?? "—",
      guide_name: row.guide_id ? guideNames[row.guide_id] ?? "Guide" : "Unassigned",
    };
  });
}

export async function createMission(payload: {
  title: string;
  description: string;
  imageUrl?: string;
  xpReward: number;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("missions").insert({
    title: payload.title,
    description: payload.description,
    image_url: payload.imageUrl?.trim() || null,
    xp_reward: payload.xpReward,
    latitude: payload.latitude,
    longitude: payload.longitude,
    radius_meters: payload.radiusMeters,
  });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getMissions() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("missions")
    .select("id, title")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export type CreateQuestPayload = {
  title: string;
  description: string;
  imageUrl?: string | null;
  /** Supabase `quests.type` (photo, quiz, choice, action, timer). */
  dbType: string;
  pointReward: number;
  difficulty: string;
  isCasual: boolean;
  missionId: string | null;
  /** Typed JSON for the matching `quest_data.*_data` column. */
  questData: Record<string, unknown>;
  validationCode?: string | null;
};

export async function createQuest(payload: CreateQuestPayload) {
  const supabase = getAdminSupabase();

  const dataColumn = `${payload.dbType}_data`;
  if (!["photo", "quiz", "choice", "action", "timer"].includes(payload.dbType)) {
    throw new Error(`Unsupported quest type: ${payload.dbType}`);
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(payload.questData);
    JSON.parse(serialized);
  } catch (err) {
    console.error("createQuest: quest_data JSON serialization failed", err, payload.questData);
    throw new Error("Quest configuration could not be serialized. Check field values.");
  }

  const { data: questRow, error: questError } = await supabase
    .from("quests")
    .insert({
      title: payload.title.trim(),
      description: payload.description.trim(),
      image_url: payload.imageUrl?.trim() || null,
      type: payload.dbType,
      point_reward: payload.pointReward,
      difficulty: payload.difficulty,
      is_casual: payload.isCasual,
      mission_id: payload.isCasual ? null : payload.missionId,
      status: "available",
      is_daily_quest: false,
    })
    .select("id")
    .single();

  if (questError) throw new Error(questError.message);

  const questDataInsert: Record<string, unknown> = {
    quest_id: questRow.id,
    [dataColumn]: JSON.parse(serialized),
  };
  if (payload.validationCode) {
    questDataInsert.validation_code = payload.validationCode;
  }

  const { error: dataError } = await supabase.from("quest_data").insert(questDataInsert);

  if (dataError) {
    console.error("createQuest: quest_data insert failed", dataError.message, questDataInsert);
    throw new Error(dataError.message);
  }

  revalidatePath("/quests");
  revalidatePath("/admin");

  return { success: true, questId: questRow.id };
}

export async function getGuides() {
  const supabase = getAdminSupabase();
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["guide", "admin"]);

  if (profilesError) throw new Error(profilesError.message);

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email")
    .in("id", ids);

  if (usersError) throw new Error(usersError.message);

  const emailById = new Map((users ?? []).map((u) => [u.id, u.email]));

  return (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailById.get(p.id) ?? null,
    role: p.role,
  }));
}

