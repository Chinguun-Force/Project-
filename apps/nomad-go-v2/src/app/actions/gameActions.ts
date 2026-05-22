'use server'
import { createClient } from '@/utils/supabase/server'
import { DEFAULT_QUEST_XP_REWARD } from '@/lib/gamification'

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
      *,
      session_missions (
        missions (
          title,
          image_url
        )
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

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
      journey_days (
        *,
        journey_steps (*)
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

    if (data.journey_days) {
      data.journey_days.sort((a: { day_number?: number }, b: { day_number?: number }) =>
        (a.day_number || 0) - (b.day_number || 0)
      );
      data.journey_days.forEach((day: { journey_steps?: { step_order?: number; time_slot?: string; time?: string }[] }) => {
        if (day.journey_steps) {
          day.journey_steps.sort(
            (a, b) =>
              (a.step_order || 0) - (b.step_order || 0) ||
              String(a.time_slot || a.time || "").localeCompare(
                String(b.time_slot || b.time || "")
              )
          );
        }
      });
    }
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
        journey_steps (*)
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

export async function completeQuestAction(userId: string, questId: string) {
  const supabase = await createClient();
  
  // 1. Fetch Quest Base Rewards
  const { data: quest, error: questError } = await supabase
    .from('quests')
    .select('id, point_reward')
    .eq('id', questId)
    .single();

  if (questError) {
    console.error('⛔ completeQuestAction:', questError.message);
    return { success: false, error: questError.message };
  }
  if (!quest) {
    return { success: false, error: "Quest not found" };
  }

  const baseXp = DEFAULT_QUEST_XP_REWARD;
  const basePoints = quest.point_reward ?? 0;

  // 2. Check if already completed
  const { data: existingCompletion } = await supabase
    .from('user_quests')
    .select('id')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .maybeSingle();

  if (existingCompletion) {
    return { success: false, error: "Quest already completed" };
  }

  // 3. Insert completion record
  const { error: insertError } = await supabase
    .from('user_quests')
    .insert({
      user_id: userId,
      quest_id: questId,
      status: 'completed'
    });

  if (insertError) {
    return { success: false, error: "Failed to record completion" };
  }

  // 4. Grant RPG Rewards
  return grantUserRewardsAction(userId, baseXp, basePoints);
}

/** Mission / journey-step completion (XP from step; optional Shagai if point_reward exists). */
export async function completeJourneyStepAction(userId: string, stepId: string) {
  const supabase = await createClient();

  const { data: step, error: stepError } = await supabase
    .from('journey_steps')
    .select('id, xp_reward, status')
    .eq('id', stepId)
    .single();

  if (stepError || !step) {
    return { success: false, error: 'Mission step not found' };
  }

  if (step.status === 'completed') {
    return { success: false, error: 'Step already completed' };
  }

  const { error: stepUpdateError } = await supabase
    .from('journey_steps')
    .update({ status: 'completed' })
    .eq('id', stepId);

  if (stepUpdateError) {
    return { success: false, error: 'Failed to record step completion' };
  }

  return grantUserRewardsAction(userId, step.xp_reward || 0, 0);
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
