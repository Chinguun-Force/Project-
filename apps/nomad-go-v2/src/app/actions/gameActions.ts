'use server'
import { createClient } from '@/utils/supabase/server'

// 1. Fetch All Live Missions from db
export async function getMissionsAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error("⛔ Supabase Error inside getMissionsAction:", error.message)
    return []
  }
  return data || []
}

// 2. Fetch All Quests (Casual + Location Locked)
export async function getQuestsAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error("⛔ Supabase Error inside getQuestsAction:", error.message)
    return []
  }
  return data || []
}

// 3. Fetch All Active Tours (Sessions) with their itinerary stats
export async function getToursAction() {
  const supabase = await createClient()
  
  const { data: sessionsData, error } = await supabase
    .from("sessions")
    .select(`
      id, name, location, is_active, journey_data,
      image_url, price, duration_days, start_date, end_date, contact_email, contact_phone, viber_link,
      journey_days!session_id (
        id,
        journey_steps!journey_steps_day_id_fkey (
          id, xp_reward
        )
      ),
      session_missions (
        missions (
          title,
          image_url
        )
      )
    `)
    .eq("is_active", true)

  if (error) {
    console.error("⛔ Supabase Error inside getToursAction:", error.message)
    return []
  }

  const formattedSessions = (sessionsData || []).map((session: any) => ({
    ...session,
    missions: session.session_missions?.map((sm: any) => sm.missions).filter(Boolean) || []
  }))

  return formattedSessions;
}

// 4. Fetch Single Tour Details for public and locked view
export async function getTourDetailsAction(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      journey_days!session_id (
        *,
        journey_steps!journey_steps_day_id_fkey (*)
      ),
      session_missions (
        missions (*)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("⛔ Supabase Error inside getTourDetailsAction:", error.message)
    return null
  }

  if (data) {
    data.missions = data.session_missions?.map((sm: any) => sm.missions).filter(Boolean) || []
    delete data.session_missions
  }

  return data;
}

export async function enrollTourAction(inviteCode: string, tourId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Unauthorized" }

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("invite_code", inviteCode)
    .eq("id", tourId)
    .eq("is_active", true)
    .single()

  if (error || !session) {
    return { error: "Invalid invite code" }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { session_id: session.id }
  })

  if (updateError) {
    console.error("⛔ Error updating user session_id:", updateError)
    return { error: "Failed to enroll" }
  }

  const { revalidatePath } = await import("next/cache")
  revalidatePath(`/tours/${tourId}`)
  
  return { success: true }
}

export async function getTouristActiveSessionAction(sessionId: string) {
  const supabase = await createClient();
  
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      journey_days (
        *,
        journey_steps!journey_steps_day_id_fkey (*)
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    return null;
  }

  // Pre-sort days and steps
  if (session.journey_days) {
    session.journey_days.sort((a: any, b: any) => a.day_number - b.day_number);
    session.journey_days.forEach((day: any) => {
      if (day.journey_steps) {
        day.journey_steps.sort((a: any, b: any) => (a.time_slot || '').localeCompare(b.time_slot || ''));
      }
    });
  }

  return session;
}

export async function grantUserRewardsAction(userId: string, baseXp: number, basePoints: number) {
  const supabase = await createClient();
  
  // Get current user stats
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('total_xp, current_xp, available_points, level, xp_threshold')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { success: false, error: "User not found" };
  }

  const currentLevel = user.level || 1;
  const currentTotalXp = Number(user.total_xp || 0);
  const currentRelativeXp = Number(user.current_xp || 0);
  const currentPoints = user.available_points || 0;
  const currentThreshold = user.xp_threshold || 1000;

  // Level multiplier (only for points)
  const finalPointReward = Math.floor(basePoints * (1 + (currentLevel * 0.05)));
  const finalXpReward = baseXp; // No level-based scaling for experience points

  let newTotalXp = currentTotalXp + finalXpReward;
  let newCurrentXp = currentRelativeXp + finalXpReward;
  let newLevel = currentLevel;
  let newThreshold = currentThreshold;

  while (newCurrentXp >= newThreshold) {
    newCurrentXp = newCurrentXp - newThreshold;
    newLevel += 1;
    newThreshold = newThreshold + 500;
  }

  const newPoints = currentPoints + finalPointReward;
  const hasLeveledUp = newLevel > currentLevel;

  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      total_xp: newTotalXp,
      current_xp: newCurrentXp,
      available_points: newPoints,
      level: newLevel,
      xp_threshold: newThreshold
    })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, finalXpReward, finalPointReward, newLevel, hasLeveledUp };
}

export async function claimDailyCheckinAction(userId: string) {
  return grantUserRewardsAction(userId, 10, 5);
}

export async function getUserProgressAction(userId: string) {
  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('total_xp, current_xp, available_points, level, xp_threshold')
    .eq('id', userId)
    .single();

  if (error || !user) return null;

  return {
    totalXp: Number(user.total_xp || 0),
    currentXp: Number(user.current_xp || 0),
    pointsBalance: Number(user.available_points || 0),
    level: Number(user.level || 1),
    xpThreshold: Number(user.xp_threshold || 1000),
  };
}
