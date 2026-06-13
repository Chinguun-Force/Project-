'use server'
import { createClient } from '@/utils/supabase/server'
import { DEFAULT_QUEST_XP_REWARD } from '@/lib/gamification'
import {
  extractMissionsFromTripJoin,
  formatTourCardMissions,
} from '@/lib/tours/formatTourCard'
import { mapRoomToActiveExpedition } from '@/lib/expedition/mapRoomToDashboard'
import { sendPushToUsers } from '@/utils/notifications/webPush'

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

/** Mission IDs the user has already completed (hidden from the mission tab). */
export async function getCompletedMissionIdsAction(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_missions')
    .select('mission_id')
    .eq('user_id', userId)

  if (error) {
    console.error('⛔ getCompletedMissionIdsAction:', error.message)
    return []
  }
  return (data ?? []).map((r) => r.mission_id as string)
}

/**
 * Complete a mission after a verified geofence dwell (10 min in radius).
 * Idempotent: unique(user_id, mission_id) prevents double XP grants.
 */
export async function completeMissionAction(userId: string, missionId: string) {
  if (!userId || !missionId) {
    return { success: false, error: 'Missing user or mission id' }
  }
  const supabase = await createClient()

  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('id, xp_reward, title')
    .eq('id', missionId)
    .single()

  if (missionError || !mission) {
    return { success: false, error: 'Mission not found' }
  }

  const xpReward = Number(mission.xp_reward ?? 0)

  // Guard against double completion before granting XP.
  const { data: existing } = await supabase
    .from('user_missions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Mission already completed', alreadyCompleted: true }
  }

  const { error: insertError } = await supabase
    .from('user_missions')
    .insert({
      user_id: userId,
      mission_id: missionId,
      status: 'completed',
      xp_awarded: xpReward,
    })

  if (insertError) {
    // Unique violation = a concurrent completion already landed; treat as done.
    if (insertError.code === '23505') {
      return { success: false, error: 'Mission already completed', alreadyCompleted: true }
    }
    console.error('⛔ completeMissionAction insert:', insertError.message)
    return { success: false, error: 'Failed to record mission completion' }
  }

  const reward = await grantUserRewardsAction(userId, xpReward, 0)

  // Best-effort push (valuable when geofence dwell auto-completes in background).
  await sendPushToUsers([userId], {
    title: "Mission complete! 🎉",
    body: `${mission.title ?? "Mission"} cleared — +${xpReward} XP earned.`,
    url: "/missions",
    tag: "mission-complete",
  })

  return { ...reward, xpReward }
}

/** Published trip templates that include a given mission/sight. */
export async function getToursForMissionAction(missionId: string) {
  const supabase = await createClient()

  const { data: tripLinks, error: tripError } = await supabase
    .from('trip_missions')
    .select('trip_id, trips(id, title, description, tenant_id, tenants(name))')
    .eq('mission_id', missionId)

  if (tripError) {
    console.error('⛔ getToursForMissionAction trips:', tripError.message)
  }

  const tripTemplates = (tripLinks ?? []).flatMap((row) => {
    const raw = row.trips as unknown
    const trip = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | null
    if (!trip || typeof trip.id !== 'string' || typeof trip.title !== 'string') {
      return []
    }
    const tenantJoin = trip.tenants as { name: string } | { name: string }[] | null | undefined
    const companyName = Array.isArray(tenantJoin)
      ? tenantJoin[0]?.name
      : tenantJoin?.name ?? null
    return [{
      type: 'trip' as const,
      id: trip.id,
      name: trip.title,
      description: typeof trip.description === 'string' ? trip.description : null,
      companyName,
    }]
  })

  return { tripTemplates }
}

/** Sights linked to a trip template (for room/trip detail). */
export async function getMissionsForTripAction(tripId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trip_missions')
    .select('missions(*)')
    .eq('trip_id', tripId)

  if (error) {
    console.error('⛔ getMissionsForTripAction:', error.message)
    return []
  }
  return (data ?? []).map((r) => r.missions).filter(Boolean)
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

// 3. Marketplace: published trip templates only
export async function getToursAction() {
  const supabase = await createClient()

  const tripsRes = await supabase
    .from('trips')
    .select(
      `
        id,
        title,
        description,
        image_url,
        price,
        duration_days,
        location,
        created_at,
        tenants ( name ),
        trip_missions (
          missions ( id, title, image_url, xp_reward )
        )
      `,
    )
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (tripsRes.error) {
    console.error('⛔ getToursAction trips:', tripsRes.error.message)
  }

  const tripCards = (tripsRes.data ?? []).map((trip) => {
    const missionList = extractMissionsFromTripJoin(
      trip.trip_missions as { missions: unknown }[],
    )
    const { missions, topMissions, extraMissionCount } =
      formatTourCardMissions(missionList)
    const tenantRaw = trip.tenants as unknown
    const tenant = (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw) as {
      name?: string
    } | null

    return {
      sourceType: 'trip' as const,
      id: trip.id,
      name: trip.title,
      description: trip.description,
      image_url: trip.image_url,
      price: trip.price != null ? Number(trip.price) : null,
      duration_days: trip.duration_days,
      location: trip.location,
      start_date: trip.created_at,
      companyName: tenant?.name ?? null,
      missions,
      topMissions,
      extraMissionCount,
    }
  })

  return tripCards
}

// 4. Fetch single published trip template (marketplace preview)
export async function getTourDetailsAction(id: string) {
  const supabase = await createClient()

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(
      `
      *,
      tenants ( name ),
      trip_missions (
        missions (*)
      ),
      master_activities (
        id,
        name,
        default_sequence_order
      )
    `,
    )
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()

  if (tripError || !trip) {
    if (tripError) {
      console.error('⛔ getTourDetailsAction trip:', tripError.message)
    }
    return null
  }

  const missionList = extractMissionsFromTripJoin(
    trip.trip_missions as { missions: unknown }[],
  )
  const { missions } = formatTourCardMissions(missionList)
  const activities = [...(trip.master_activities ?? [])].sort(
    (a, b) => a.default_sequence_order - b.default_sequence_order,
  )

  const journey_days = [
    {
      id: 'trip-itinerary',
      day_number: 1,
      title: trip.duration_days
        ? `${trip.duration_days}-day expedition preview`
        : 'Itinerary preview',
      journey_steps: activities.map((act, stepIdx) => ({
        id: act.id,
        title: act.name,
        step_order: stepIdx,
        time_slot: '',
      })),
    },
  ]

  const tenantRaw = trip.tenants as unknown
  const tenant = (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw) as {
    name?: string
  } | null

  return {
    sourceType: 'trip' as const,
    id: trip.id,
    name: trip.title,
    description: trip.description,
    image_url: trip.image_url,
    price: trip.price != null ? Number(trip.price) : null,
    duration_days: trip.duration_days,
    location: trip.location,
    start_date: trip.created_at,
    companyName: tenant?.name ?? null,
    missions,
    journey_days,
    isTripTemplate: true,
  }
}

/** Clears legacy auth metadata so tourist re-joins with room_code. */
export async function clearLegacySessionMetadataAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const meta = user.user_metadata ?? {};
  if (!meta.session_id && meta.room_id) {
    return { success: true as const, cleared: false };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...meta,
      session_id: null,
      room_id: meta.room_id ?? null,
      trip_id: meta.trip_id ?? null,
    },
  });

  if (error) return { error: error.message };
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");
  return { success: true as const, cleared: true };
}

/** Join live expedition via moderator-issued room code (SDD dashboard flow). */
export async function joinRoomByCodeAction(roomCode: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const trimmed = roomCode.trim()
  if (!trimmed) return { error: 'Enter your expedition code' }

  const { data, error } = await supabase.rpc('join_room_by_code', {
    p_room_code: trimmed,
  })

  if (error) {
    console.error('⛔ join_room_by_code:', error.message)
    const msg = error.message.includes('Invalid room code')
      ? 'Invalid expedition code'
      : error.message
    return { error: msg }
  }

  const payload = data as { room_id?: string; trip_id?: string; room_code?: string } | null
  if (!payload?.room_id) {
    return { error: 'Could not join expedition' }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      room_id: payload.room_id,
      trip_id: payload.trip_id ?? null,
      session_id: null,
    },
  })

  if (updateError) {
    console.error('⛔ joinRoom metadata:', updateError.message)
    return { error: 'Joined room but failed to save profile state' }
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/')
  revalidatePath('/tours')

  await sendPushToUsers([user.id], {
    title: "You joined the expedition! 🏔️",
    body: "Your live agenda is ready. Watch for tips from your guide.",
    url: "/",
    tag: "room-join",
  })

  return {
    success: true as const,
    roomId: payload.room_id,
    tripId: payload.trip_id ?? null,
    roomCode: payload.room_code ?? trimmed,
  }
}

async function resolveActiveRoomId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  metadataRoomId?: string | null,
) {
  // Source of truth is room_members (RLS lets a tourist read their own rows).
  // Only ACTIVE rooms count: once a room is archived (all activities done) it
  // drops off the dashboard so the traveler can enter the next journey's code.
  // We honour the metadata room_id only when it's still an active membership,
  // otherwise stale metadata would short-circuit to an inaccessible room.
  const { data: memberships } = await supabase
    .from('room_members')
    .select('room_id, joined_at, rooms(status)')
    .eq('profile_id', userId)
    .order('joined_at', { ascending: false })

  const activeRoomIds = (memberships ?? [])
    .filter((m) => {
      const room = Array.isArray(m.rooms) ? m.rooms[0] : m.rooms
      return (room as { status?: string } | null)?.status === 'active'
    })
    .map((m) => m.room_id as string)

  if (metadataRoomId && activeRoomIds.includes(metadataRoomId)) {
    return metadataRoomId
  }

  return activeRoomIds[0] ?? null
}

/** Active expedition for dashboard — rooms + live room_activities timeline. */
export async function getTouristActiveRoomAction(
  userId: string,
  metadataRoomId?: string | null,
) {
  const supabase = await createClient()
  const roomId = await resolveActiveRoomId(supabase, userId, metadataRoomId)
  if (!roomId) return null

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select(
      `
      id,
      room_code,
      trip_id,
      status,
      trips (
        title,
        location,
        image_url,
        description
      ),
      room_activities (
        id,
        name,
        sequence_order,
        status
      )
    `,
    )
    .eq('id', roomId)
    .maybeSingle()

  if (roomError || !room) {
    console.error('⛔ getTouristActiveRoomAction:', roomError?.message)
    return null
  }

  const tripRaw = room.trips as unknown
  const trip = (Array.isArray(tripRaw) ? tripRaw[0] : tripRaw) as {
    title: string
    location?: string | null
    image_url?: string | null
  } | null

  const activities = (room.room_activities ?? []) as {
    id: string
    name: string
    sequence_order: number
    status: string
  }[]

  return mapRoomToActiveExpedition({
    room: { id: room.id, room_code: room.room_code, trip_id: room.trip_id },
    trip,
    activities,
  })
}

/** Tourist marks an in-progress agenda stop complete (guide must start it first). */
export async function completeRoomActivityAction(
  userId: string,
  activityId: string,
) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('tourist_complete_room_activity', {
    p_activity_id: activityId,
  })

  if (error) {
    return { success: false as const, error: error.message }
  }

  const payload = data as { xp_reward?: number } | null
  const xp = Number(payload?.xp_reward ?? 25)

  return grantUserRewardsAction(userId, xp, 0)
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

/** @deprecated Use completeRoomActivityAction — kept for API routes still on journey_steps. */
export async function completeJourneyStepAction(userId: string, stepId: string) {
  return completeRoomActivityAction(userId, stepId)
}

export async function claimDailyCheckinAction(userId: string) {
  return grantUserRewardsAction(userId, 10, 5);
}

export async function getUserProgressAction(userId: string) {
  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('total_xp, current_xp, available_points, level, xp_threshold, completed_quests')
    .eq('id', userId)
    .single();

  if (error || !user) return null;

  return {
    totalXp: Number(user.total_xp || 0),
    currentXp: Number(user.current_xp || 0),
    pointsBalance: Number(user.available_points || 0),
    level: Number(user.level || 1),
    xpThreshold: Number(user.xp_threshold || 1000),
    completedQuests: Number(user.completed_quests || 0),
  };
}
