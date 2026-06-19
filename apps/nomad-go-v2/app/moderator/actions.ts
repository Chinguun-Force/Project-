"use server";

import {
  createClient as createServiceClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseConfig } from "@/utils/supabase/config";
import { isCompanyModerator } from "@/lib/auth/roles";
import { sendPushToUsers } from "@/utils/notifications/webPush";

export type ModeratorContext = {
  userId: string;
  tenantId: string;
  fullName: string | null;
  companyName: string | null;
};

async function requireModerator(): Promise<{
  ctx: ModeratorContext;
  supabase: SupabaseClient;
  service: SupabaseClient;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, tenant_id, full_name, tenants(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!isCompanyModerator(profile?.role) || !profile?.tenant_id) {
    throw new Error(
      "You must be a company moderator with an assigned travel company.",
    );
  }

  const tenantJoin = profile.tenants as { name: string } | { name: string }[] | null;
  const companyName = Array.isArray(tenantJoin)
    ? tenantJoin[0]?.name ?? null
    : tenantJoin?.name ?? null;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const { url } = getSupabaseConfig();
  const service = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    ctx: {
      userId: user.id,
      tenantId: profile.tenant_id,
      fullName: profile.full_name,
      companyName,
    },
    supabase,
    service,
  };
}

export async function getModeratorContextAction(): Promise<ModeratorContext> {
  const { ctx } = await requireModerator();
  return ctx;
}

export async function getModeratorDashboardStatsAction() {
  const { ctx, supabase } = await requireModerator();
  const tenantId = ctx.tenantId;

  const [teamRes, tripsRes, roomsRes, activeRoomsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("tenant_id", tenantId),
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("rooms").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
  ]);

  const team = teamRes.data ?? [];
  return {
    companyName: ctx.companyName,
    guides: team.filter((p) => p.role === "guide").length,
    moderators: team.filter((p) => p.role === "moderator").length,
    tripTemplates: tripsRes.count ?? 0,
    rooms: roomsRes.count ?? 0,
    activeRooms: activeRoomsRes.count ?? 0,
  };
}

export async function getModeratorTeamAction() {
  const { ctx, supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, created_at")
    .eq("tenant_id", ctx.tenantId)
    .order("role")
    .order("full_name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Send a hire invite to an admin-approved guide (must confirm before joining). */
export async function hireGuideAction(profileId: string) {
  const { ctx, supabase, service } = await requireModerator();

  const { data: guide, error: guideError } = await service
    .from("profiles")
    .select("id, role, tenant_id, full_name")
    .eq("id", profileId)
    .maybeSingle();

  if (guideError) throw new Error(guideError.message);
  if (!guide || guide.role !== "guide") {
    throw new Error("Only users with the guide role can be hired.");
  }
  if (guide.tenant_id) {
    throw new Error("This guide is already assigned to a travel company.");
  }

  const { data: existing } = await supabase
    .from("guide_hire_requests")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("guide_id", profileId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    throw new Error("A pending invite was already sent to this guide.");
  }

  const { error } = await supabase.from("guide_hire_requests").insert({
    tenant_id: ctx.tenantId,
    guide_id: profileId,
    invited_by: ctx.userId,
    status: "pending",
  });

  if (error) throw new Error(error.message);

  await sendPushToUsers([profileId], {
    title: "Guide invitation",
    body: `${ctx.companyName ?? "A travel company"} invited you to join their team. Open your Guide panel to respond.`,
    url: "/guide",
    tag: `guide-hire-${ctx.tenantId}`,
  }).catch(() => undefined);

  revalidatePath("/moderator/team");
  return { success: true };
}

export async function cancelGuideHireAction(requestId: string) {
  const { ctx, supabase } = await requireModerator();

  const { error } = await supabase
    .from("guide_hire_requests")
    .update({
      status: "cancelled",
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  revalidatePath("/moderator/team");
  return { success: true };
}

export async function getHireCandidatesAction() {
  const { ctx, service } = await requireModerator();

  const { data: pending } = await service
    .from("guide_hire_requests")
    .select("guide_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "pending");

  const pendingIds = new Set((pending ?? []).map((r) => r.guide_id));

  const { data: profiles, error } = await service
    .from("profiles")
    .select("id, role, full_name, tenant_id")
    .eq("role", "guide")
    .is("tenant_id", null)
    .order("full_name")
    .limit(50);

  if (error) throw new Error(error.message);

  const available = (profiles ?? []).filter((p) => !pendingIds.has(p.id));
  const ids = available.map((p) => p.id);
  if (ids.length === 0) return [];

  const { data: users } = await service
    .from("users")
    .select("id, email")
    .in("id", ids);

  const emailById = new Map((users ?? []).map((u) => [u.id, u.email]));

  return available.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailById.get(p.id) ?? null,
  }));
}

export async function getModeratorPendingHiresAction() {
  const { ctx, supabase, service } = await requireModerator();

  const { data, error } = await supabase
    .from("guide_hire_requests")
    .select("id, guide_id, created_at, status")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const guideIds = data.map((r) => r.guide_id);
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name")
    .in("id", guideIds);

  const { data: users } = await service
    .from("users")
    .select("id, email")
    .in("id", guideIds);

  const nameById = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? "Guide"]),
  );
  const emailById = Object.fromEntries(
    (users ?? []).map((u) => [u.id, u.email ?? null]),
  );

  return data.map((r) => ({
    id: r.id,
    guide_id: r.guide_id,
    guide_name: nameById[r.guide_id] ?? "Guide",
    guide_email: emailById[r.guide_id] ?? null,
    created_at: r.created_at,
  }));
}

export async function getModeratorTripsAction() {
  const { ctx, supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, title, description, image_url, price, duration_days, location, is_published, created_at",
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTripTemplateAction(payload: {
  title: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  durationDays?: number;
  location?: string;
  isPublished?: boolean;
}) {
  const { ctx, supabase } = await requireModerator();
  const title = payload.title.trim();
  if (!title) throw new Error("Trip title is required");

  const { error } = await supabase.from("trips").insert({
    tenant_id: ctx.tenantId,
    title,
    description: payload.description?.trim() || null,
    image_url: payload.imageUrl?.trim() || null,
    price: payload.price ?? null,
    duration_days: payload.durationDays ?? null,
    location: payload.location?.trim() || null,
    is_published: payload.isPublished ?? false,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/moderator/templates");
  revalidatePath("/moderator");
  revalidatePath("/tours");
  return { success: true };
}

export async function updateTripMarketplaceAction(
  tripId: string,
  payload: {
    title?: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    durationDays?: number;
    location?: string;
    isPublished?: boolean;
  },
) {
  const { supabase } = await requireModerator();

  const { error } = await supabase
    .from("trips")
    .update({
      ...(payload.title !== undefined && { title: payload.title.trim() }),
      ...(payload.description !== undefined && {
        description: payload.description.trim() || null,
      }),
      ...(payload.imageUrl !== undefined && {
        image_url: payload.imageUrl.trim() || null,
      }),
      ...(payload.price !== undefined && { price: payload.price }),
      ...(payload.durationDays !== undefined && {
        duration_days: payload.durationDays,
      }),
      ...(payload.location !== undefined && {
        location: payload.location.trim() || null,
      }),
      ...(payload.isPublished !== undefined && {
        is_published: payload.isPublished,
      }),
    })
    .eq("id", tripId);

  if (error) throw new Error(error.message);
  revalidatePath("/moderator/templates");
  revalidatePath("/tours");
  return { success: true };
}

export async function getTripActivitiesAction(tripId: string) {
  const { supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("master_activities")
    .select("id, name, default_sequence_order")
    .eq("trip_id", tripId)
    .order("default_sequence_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addTripActivityAction(payload: {
  tripId: string;
  name: string;
  sequenceOrder: number;
}) {
  const { supabase } = await requireModerator();
  const name = payload.name.trim();
  if (!name) throw new Error("Activity name is required");

  const { error } = await supabase.from("master_activities").insert({
    trip_id: payload.tripId,
    name,
    default_sequence_order: payload.sequenceOrder,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/moderator/templates");
  return { success: true };
}

/** Global sightseeing catalog (gamification POIs). */
export async function getCatalogMissionsAction() {
  const { supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("missions")
    .select("id, title, description, image_url, xp_reward, latitude, longitude, radius_meters")
    .order("title");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTripMissionsAction(tripId: string) {
  const { supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("trip_missions")
    .select(
      "mission_id, missions(id, title, description, image_url, xp_reward, radius_meters)",
    )
    .eq("trip_id", tripId);

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => row.missions)
    .filter(Boolean);
}

export async function addTripMissionAction(tripId: string, missionId: string) {
  const { supabase } = await requireModerator();
  const { error } = await supabase.from("trip_missions").insert({
    trip_id: tripId,
    mission_id: missionId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/moderator/templates");
  return { success: true };
}

export async function removeTripMissionAction(tripId: string, missionId: string) {
  const { supabase } = await requireModerator();
  const { error } = await supabase
    .from("trip_missions")
    .delete()
    .eq("trip_id", tripId)
    .eq("mission_id", missionId);

  if (error) throw new Error(error.message);
  revalidatePath("/moderator/templates");
  return { success: true };
}

export async function getCompanyGuidesAction() {
  const { ctx, supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("tenant_id", ctx.tenantId)
    .eq("role", "guide")
    .order("full_name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getModeratorRoomsAction() {
  const { ctx, supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, room_code, status, created_at, guide_id, trip_id, trips(title)")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const guideIds = [...new Set((data ?? []).map((r) => r.guide_id).filter(Boolean))] as string[];
  let guideNames: Record<string, string> = {};
  if (guideIds.length > 0) {
    const { data: guides } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", guideIds);
    guideNames = Object.fromEntries(
      (guides ?? []).map((g) => [g.id, g.full_name ?? ""]),
    );
  }

  return (data ?? []).map((r) => ({
    ...r,
    guide_name: r.guide_id ? guideNames[r.guide_id] ?? null : null,
  }));
}

export async function createRoomAction(payload: {
  tripId: string;
  guideId: string | null;
  roomCode: string;
}) {
  const { ctx, supabase } = await requireModerator();
  const roomCode = payload.roomCode.trim().toUpperCase();
  if (!roomCode) throw new Error("Room code is required");

  const { error } = await supabase.from("rooms").insert({
    tenant_id: ctx.tenantId,
    trip_id: payload.tripId,
    guide_id: payload.guideId || null,
    room_code: roomCode,
    status: "active",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/moderator/rooms");
  revalidatePath("/moderator");
  return { success: true };
}

export type TenantProfile = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  website: string | null;
  location: string | null;
};

export async function getTenantProfileAction(): Promise<TenantProfile> {
  const { ctx, supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, description, logo_url, contact_email, website, location")
    .eq("id", ctx.tenantId)
    .single();

  if (error) throw new Error(error.message);
  return data as TenantProfile;
}

export async function updateTenantProfileAction(payload: {
  name: string;
  description?: string;
  logoUrl?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  location?: string | null;
}) {
  const { ctx, supabase } = await requireModerator();
  const name = payload.name.trim();
  if (!name) throw new Error("Company name is required");

  const { error } = await supabase
    .from("tenants")
    .update({
      name,
      description: payload.description?.trim() || null,
      logo_url: payload.logoUrl?.trim() || null,
      contact_email: payload.contactEmail?.trim() || null,
      website: payload.website?.trim() || null,
      location: payload.location?.trim() || null,
    })
    .eq("id", ctx.tenantId);

  if (error) throw new Error(error.message);

  revalidatePath("/moderator/company");
  revalidatePath("/moderator");
  revalidatePath("/tours");
  revalidatePath("/admin");
  return { success: true };
}
