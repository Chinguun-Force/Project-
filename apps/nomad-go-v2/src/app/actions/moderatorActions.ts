'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Create Tour Session
export async function createTourSessionAction(data: {
  name: string
  location: string
  start_date: string
  end_date: string
  duration_days: number
  price: number
  image_url: string
  contact_email: string
  contact_phone: string
  viber_link: string
  invite_code: string
  mission_ids?: string[]
}) {
  const supabase = await createClient()
  const { data: session, error } = await supabase.from('sessions').insert({
    name: data.name,
    location: data.location,
    start_date: data.start_date,
    end_date: data.end_date,
    duration_days: data.duration_days,
    price: data.price,
    image_url: data.image_url,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone,
    viber_link: data.viber_link,
    invite_code: data.invite_code,
    is_active: true
  }).select('id').single()

  if (error || !session) {
    console.error("⛔ Error creating tour session:", error?.message)
    return { success: false, error: error?.message }
  }

  // Auto-generate Journey Days
  if (data.duration_days > 0) {
    for (let i = 0; i < data.duration_days; i++) {
      const { error: daysError } = await supabase.from('journey_days').insert({
        session_id: session.id,
        day_number: i + 1,
        title: `Day ${i + 1}`,
        location: data.location || ''
      })
      
      if (daysError) {
        console.error(`⛔ Error auto-generating Day ${i + 1}:`, daysError.message)
        // Cleanup the session if we failed to create the days
        await supabase.from('sessions').delete().eq('id', session.id)
        return { success: false, error: `Failed to create Day ${i + 1}: ${daysError.message}` }
      }
    }
  }

  // Link Missions
  if (data.mission_ids && data.mission_ids.length > 0) {
    const sessionMissions = data.mission_ids.map(mId => ({
      session_id: session.id,
      mission_id: mId
    }))
    const { error: smError } = await supabase.from('session_missions').insert(sessionMissions)
    if (smError) {
      console.error("⛔ Error linking missions:", smError.message)
    }
  }

  revalidatePath('/moderator')
  return { success: true }
}

// 2. Add Journey Day
export async function addJourneyDayAction(data: {
  session_id: string
  day_number: number
  title: string
  location: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('journey_days').insert({
    session_id: data.session_id,
    day_number: data.day_number,
    title: data.title,
    location: data.location
  })

  if (error) {
    console.error("⛔ Error adding journey day:", error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/moderator')
  return { success: true }
}

// 3. Add Journey Step
export async function addJourneyStepAction(data: {
  day_id: string
  time_slot: string
  title: string
  description: string
  xp_reward: number
}) {
  const supabase = await createClient()

  // Auto-order logic
  const { count, error: countError } = await supabase
    .from('journey_steps')
    .select('*', { count: 'exact', head: true })
    .eq('day_id', data.day_id)
  
  const step_order = (count || 0) + 1

  const { error } = await supabase.from('journey_steps').insert({
    day_id: data.day_id,
    journey_day_id: data.day_id,
    step_order: step_order,
    time_slot: data.time_slot,
    time: data.time_slot,
    title: data.title,
    description: data.description,
    xp_reward: data.xp_reward,
    status: 'pending'
  })

  if (error) {
    console.error("⛔ Error adding journey step:", error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/moderator')
  return { success: true }
}

// 4. Get All Moderator Sessions
export async function getModeratorSessionsAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("⛔ Error fetching sessions:", error.message)
    return []
  }
  return data || []
}

// 5. Get Moderator Itinerary
export async function getModeratorItineraryAction(session_id: string) {
  const supabase = await createClient()
  
  // Fetch Days
  const { data: days, error: daysError } = await supabase
    .from('journey_days')
    .select('*')
    .eq('session_id', session_id)
    .order('day_number', { ascending: true })

  if (daysError || !days) {
    console.error("⛔ Error fetching days:", daysError?.message)
    return []
  }

  // Fetch Steps for these days
  const dayIds = days.map(d => d.id)
  
  let steps: any[] = []
  if (dayIds.length > 0) {
    const { data: stepsData, error: stepsError } = await supabase
      .from('journey_steps')
      .select('*')
      .in('day_id', dayIds)
      .order('step_order', { ascending: true })
      
    if (!stepsError && stepsData) {
      steps = stepsData
    }
  }

  // Combine
  return days.map(day => ({
    ...day,
    steps: steps.filter(step => step.day_id === day.id || step.journey_day_id === day.id)
  }))
}

// 6. Get All Global Missions
export async function getAllGlobalMissionsAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("⛔ Error fetching global missions:", error.message)
    return []
  }
  return data || []
}
