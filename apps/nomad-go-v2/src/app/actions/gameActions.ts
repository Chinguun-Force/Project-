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
      journey_days (
        id,
        journey_steps (
          id, xp_reward
        )
      )
    `)
    .eq("is_active", true)

  if (error) {
    console.error("⛔ Supabase Error inside getToursAction:", error.message)
    return []
  }

  // Pre-calculate stats on the server
  const plans = (sessionsData || []).map((session, idx) => {
    let totalXp = 0;
    let missionsCount = 0;
    
    if (session.journey_days) {
      session.journey_days.forEach((day: any) => {
        if (day.journey_steps) {
          missionsCount += day.journey_steps.length;
          day.journey_steps.forEach((step: any) => {
            totalXp += (step.xp_reward || 0);
          });
        }
      });
    }

    const jData = session.journey_data as any;
    
    // Server-side fallback images
    const tourImages: Record<number, string> = {
      1: "/quest-steppe.jpg",
      2: "/quest-terelj.jpg",
      3: "/quest-ulanbaatar.jpg",
      4: "/quest-naadam.jpg",
      5: "/quest-gps.jpg",
      6: "/quest-dumplings.jpg",
    };

    return {
      id: session.id,
      title: session.name || "Untitled Tour",
      description: jData?.description || `Explore ${session.location}`,
      imageUrl: jData?.imageUrl || tourImages[(idx % 6) + 1],
      difficulty: jData?.difficulty || "medium",
      totalXp,
      missionsCount,
      estimatedDuration: session.journey_days?.length ? session.journey_days.length * 24 : 24,
    };
  });

  return plans;
}
