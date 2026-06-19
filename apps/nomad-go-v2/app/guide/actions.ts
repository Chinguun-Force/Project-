"use server";

import {
  createClient as createServiceClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseConfig } from "@/utils/supabase/config";
import { isGuide } from "@/lib/auth/roles";
import { sendPushToRoom } from "@/utils/notifications/webPush";

export type GuideContext = {
  userId: string;
  tenantId: string | null;
  fullName: string | null;
  companyName: string | null;
};

async function requireGuideProfile(): Promise<{
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
  if (!isGuide(profile?.role)) {
    throw new Error("You must be a field guide.");
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
      tenantId: profile?.tenant_id ?? null,
      fullName: profile?.full_name ?? null,
      companyName,
    },
    supabase,
    service,
  };
}

async function requireAssignedGuide(): Promise<{
  ctx: GuideContext & { tenantId: string };
  supabase: SupabaseClient;
  service: SupabaseClient;
}> {
  const base = await requireGuideProfile();
  if (!base.ctx.tenantId) {
    throw new Error(
      "Accept a company invitation first before managing assigned rooms.",
    );
  }
  return {
    ctx: base.ctx as GuideContext & { tenantId: string },
    supabase: base.supabase,
    service: base.service,
  };
}

/** @deprecated alias */
async function requireGuide() {
  return requireAssignedGuide();
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

export type ActivityStatus = "pending" | "in_progress" | "completed";

export async function getGuideContextAction(): Promise<GuideContext> {
  const { ctx } = await requireGuideProfile();
  return ctx;
}

export async function getGuideHireInvitesAction() {
  const { ctx, supabase, service } = await requireGuideProfile();
  if (ctx.tenantId) return [];

  const { data, error } = await supabase
    .from("guide_hire_requests")
    .select("id, tenant_id, created_at, invited_by")
    .eq("guide_id", ctx.userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const tenantIds = [...new Set(data.map((r) => r.tenant_id))];
  const { data: tenants } = await service
    .from("tenants")
    .select("id, name, logo_url, location")
    .in("id", tenantIds);

  const tenantById = Object.fromEntries((tenants ?? []).map((t) => [t.id, t]));

  return data.map((r) => ({
    id: r.id,
    tenant_id: r.tenant_id,
    company_name: tenantById[r.tenant_id]?.name ?? "Travel company",
    company_logo: tenantById[r.tenant_id]?.logo_url ?? null,
    company_location: tenantById[r.tenant_id]?.location ?? null,
    created_at: r.created_at,
  }));
}

export async function acceptGuideHireAction(requestId: string) {
  const { ctx, supabase, service } = await requireGuideProfile();
  if (ctx.tenantId) {
    throw new Error("You are already linked to a travel company.");
  }

  const { data: request, error: fetchError } = await supabase
    .from("guide_hire_requests")
    .select("id, tenant_id, status")
    .eq("id", requestId)
    .eq("guide_id", ctx.userId)
    .eq("status", "pending")
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!request) throw new Error("Invitation not found or already handled.");

  const now = new Date().toISOString();

  const { error: acceptError } = await supabase
    .from("guide_hire_requests")
    .update({ status: "accepted", responded_at: now })
    .eq("id", requestId)
    .eq("guide_id", ctx.userId)
    .eq("status", "pending");

  if (acceptError) throw new Error(acceptError.message);

  const { error: profileError } = await service
    .from("profiles")
    .update({ tenant_id: request.tenant_id })
    .eq("id", ctx.userId)
    .eq("role", "guide");

  if (profileError) throw new Error(profileError.message);

  await service
    .from("guide_hire_requests")
    .update({ status: "cancelled", responded_at: now })
    .eq("guide_id", ctx.userId)
    .eq("status", "pending")
    .neq("id", requestId);

  revalidatePath("/guide");
  revalidatePath("/moderator/team");
  return { success: true, tenantId: request.tenant_id };
}

export async function declineGuideHireAction(requestId: string) {
  const { ctx, supabase } = await requireGuideProfile();

  const { error } = await supabase
    .from("guide_hire_requests")
    .update({
      status: "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("guide_id", ctx.userId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  revalidatePath("/guide");
  revalidatePath("/moderator/team");
  return { success: true };
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
  note?: string,
) {
  const { ctx, supabase } = await requireGuide();
  await assertGuideOwnsRoom(supabase, ctx.userId, roomId);

  const allowed: ActivityStatus[] = ["pending", "in_progress", "completed"];
  if (!allowed.includes(status)) throw new Error("Invalid status");

  const { data: updated, error } = await supabase
    .from("room_activities")
    .update({ status })
    .eq("id", activityId)
    .eq("room_id", roomId)
    .select("name")
    .maybeSingle();

  if (error) throw new Error(error.message);

  // After marking an activity completed, check whether the whole expedition
  // is now finished. The DB trigger archives the room; here we just decide
  // which push to send and surface a flag to the caller.
  let roomCompleted = false;
  if (status === "completed") {
    const { data: acts } = await supabase
      .from("room_activities")
      .select("status")
      .eq("room_id", roomId);
    const total = acts?.length ?? 0;
    const done = (acts ?? []).filter((a) => a.status === "completed").length;
    roomCompleted = total > 0 && total === done;
  }

  const trimmedNote = note?.trim();
  if (roomCompleted) {
    await sendPushToRoom(roomId, {
      title: "Expedition complete! 🎉",
      body: `You've finished every activity.${trimmedNote ? ` ${trimmedNote}` : " What a journey!"}`,
      url: "/",
      tag: `room-${roomId}-complete`,
    });
  } else if (status === "in_progress" || status === "completed") {
    const name = updated?.name ?? "Your activity";
    await sendPushToRoom(roomId, {
      title: status === "in_progress" ? "Activity starting" : "Activity complete",
      body:
        status === "in_progress"
          ? `${name} is starting now.${trimmedNote ? ` ${trimmedNote}` : ""}`
          : `${name} is done.${trimmedNote ? ` ${trimmedNote}` : ""}`,
      url: "/",
      tag: `room-${roomId}-activity`,
    });
  }

  revalidatePath(`/guide/rooms/${roomId}`);
  revalidatePath("/guide");
  return { success: true, roomCompleted };
}

/** Advance: pending → in_progress → completed */
export async function advanceRoomActivityAction(
  activityId: string,
  roomId: string,
  note?: string,
) {
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

  return updateRoomActivityStatusAction(activityId, roomId, next, note);
}

/**
 * Guide sends a free-form tip/reminder to everyone in their room
 * (e.g. "Bring water before the horse ride", "Don't forget your camera").
 */
export async function sendRoomReminderAction(roomId: string, message: string) {
  const { ctx, supabase } = await requireGuide();
  await assertGuideOwnsRoom(supabase, ctx.userId, roomId);

  const trimmed = message.trim();
  if (!trimmed) throw new Error("Reminder message is empty");
  if (trimmed.length > 280) throw new Error("Reminder is too long (max 280 chars)");

  const delivered = await sendPushToRoom(roomId, {
    title: ctx.companyName
      ? `Guide tip · ${ctx.companyName}`
      : "Tip from your guide",
    body: trimmed,
    url: "/",
    tag: `room-${roomId}-reminder`,
  });

  return { success: true, delivered };
}
