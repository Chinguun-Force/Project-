"use server";

import {
  createClient as createServiceClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseConfig } from "@/utils/supabase/config";
import { isGuide } from "@/lib/auth/roles";

export type GuideContext = {
  userId: string;
  tenantId: string;
  fullName: string | null;
  companyName: string | null;
};

export type ActivityStatus = "pending" | "in_progress" | "completed";

async function requireGuide(): Promise<{
  ctx: GuideContext;
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
  if (!isGuide(profile?.role) || !profile?.tenant_id) {
    throw new Error("You must be a field guide assigned to a travel company.");
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

async function assertGuideOwnsRoom(
  supabase: SupabaseClient,
  userId: string,
  roomId: string,
) {
  const { data: room, error } = await supabase
    .from("rooms")
    .select("id, guide_id, room_code, status, trip_id")
    .eq("id", roomId)
    .eq("guide_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!room) throw new Error("Room not found or you are not assigned as guide");
  return room;
}

export async function getGuideContextAction(): Promise<GuideContext> {
  const { ctx } = await requireGuide();
  return ctx;
}

export async function getGuideAssignedRoomsAction() {
  const { ctx, supabase, service } = await requireGuide();

  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, room_code, status, trip_id, created_at")
    .eq("guide_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!rooms?.length) return [];

  const tripIds = [...new Set(rooms.map((r) => r.trip_id))];
  const { data: trips } = await service
    .from("trips")
    .select("id, title")
    .in("id", tripIds);

  const titleByTrip = Object.fromEntries((trips ?? []).map((t) => [t.id, t.title]));

  const roomIds = rooms.map((r) => r.id);
  const { data: activities } = await supabase
    .from("room_activities")
    .select("room_id, status")
    .in("room_id", roomIds);

  const progressByRoom: Record<string, { total: number; completed: number }> = {};
  for (const id of roomIds) {
    progressByRoom[id] = { total: 0, completed: 0 };
  }
  for (const a of activities ?? []) {
    const p = progressByRoom[a.room_id];
    if (!p) continue;
    p.total += 1;
    if (a.status === "completed") p.completed += 1;
  }

  return rooms.map((r) => ({
    ...r,
    trip_title: titleByTrip[r.trip_id] ?? "Tour",
    progress: progressByRoom[r.id] ?? { total: 0, completed: 0 },
  }));
}

export async function getGuideRoomDetailAction(roomId: string) {
  const { ctx, supabase, service } = await requireGuide();
  const room = await assertGuideOwnsRoom(supabase, ctx.userId, roomId);

  const { data: trip } = await service
    .from("trips")
    .select("title")
    .eq("id", room.trip_id)
    .maybeSingle();

  const { data: activities, error } = await supabase
    .from("room_activities")
    .select("id, name, sequence_order, status")
    .eq("room_id", roomId)
    .order("sequence_order");

  if (error) throw new Error(error.message);

  const { data: missionLinks } = await supabase
    .from("trip_missions")
    .select("missions(id, title, description, image_url, xp_reward, radius_meters, latitude, longitude)")
    .eq("trip_id", room.trip_id);

  const missions = (missionLinks ?? [])
    .map((r) => r.missions)
    .filter(Boolean);

  return {
    room: {
      id: room.id,
      room_code: room.room_code,
      status: room.status,
      trip_title: trip?.title ?? "Tour",
    },
    activities: activities ?? [],
    missions,
  };
}

export async function updateRoomActivityStatusAction(
  activityId: string,
  roomId: string,
  status: ActivityStatus,
) {
  const { ctx, supabase } = await requireGuide();
  await assertGuideOwnsRoom(supabase, ctx.userId, roomId);

  const allowed: ActivityStatus[] = ["pending", "in_progress", "completed"];
  if (!allowed.includes(status)) throw new Error("Invalid status");

  const { error } = await supabase
    .from("room_activities")
    .update({ status })
    .eq("id", activityId)
    .eq("room_id", roomId);

  if (error) throw new Error(error.message);

  revalidatePath(`/guide/rooms/${roomId}`);
  revalidatePath("/guide");
  return { success: true };
}

/** Advance: pending → in_progress → completed */
export async function advanceRoomActivityAction(activityId: string, roomId: string) {
  const { ctx, supabase } = await requireGuide();
  await assertGuideOwnsRoom(supabase, ctx.userId, roomId);

  const { data: activity, error: fetchError } = await supabase
    .from("room_activities")
    .select("status")
    .eq("id", activityId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!activity) throw new Error("Activity not found");

  const next: ActivityStatus =
    activity.status === "pending"
      ? "in_progress"
      : activity.status === "in_progress"
        ? "completed"
        : "completed";

  return updateRoomActivityStatusAction(activityId, roomId, next);
}
