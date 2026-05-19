"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function getUsers() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, avatar_url, current_xp")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin" as any);
  return { success: true };
}

export async function getJourneyDays() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("journey_days")
    .select("id, title, session_id, sessions(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createMission(payload: {
  title: string;
  description: string;
  xpReward: number;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("missions").insert({
    title: payload.title,
    description: payload.description,
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

export async function createQuest(payload: {
  title: string;
  description: string;
  type: string;
  pointReward: number;
  difficulty: string;
  isCasual: boolean;
  missionId: string | null;
  questData: any;
}) {
  const supabase = getAdminSupabase();
  
  // 1. Insert Quest
  const { data: questData, error: questError } = await supabase
    .from("quests")
    .insert({
      title: payload.title,
      description: payload.description,
      type: payload.type,
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

  // 2. Insert Quest Data (Metadata)
  const { error: dataError } = await supabase.from("quest_data").insert({
    quest_id: questData.id,
    [payload.type + "_data"]: payload.questData, // e.g. quiz_data or photo_data
  });

  if (dataError) throw new Error(dataError.message);
  
  return { success: true };
}

export async function getGuides() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("role", ["guide", "admin"]);

  if (error) throw new Error(error.message);
  return data;
}

export async function createSession(payload: {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  guideId: string | null;
}) {
  const supabase = getAdminSupabase();
  
  // Generate a random 6-character alphanumeric invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase.from("sessions").insert({
    name: payload.name,
    location: payload.location,
    start_date: new Date(payload.startDate).toISOString(),
    end_date: new Date(payload.endDate).toISOString(),
    guide_id: payload.guideId || null,
    invite_code: inviteCode,
    is_active: true,
  });

  if (error) throw new Error(error.message);
  return { success: true, inviteCode };
}
