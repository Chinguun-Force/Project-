'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Create Tour Session
export async function createTourSessionAction(data: {
  name: string
  location: string
  start_date: string
  end_date: string
  invite_code: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('sessions').insert({
    name: data.name,
    location: data.location,
    start_date: data.start_date,
    end_date: data.end_date,
    invite_code: data.invite_code,
    is_active: true
  })

  if (error) {
    console.error("⛔ Error creating tour session:", error.message)
    return { success: false, error: error.message }
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
  step_order: number
  time_slot: string
  title: string
  description: string
  xp_reward: number
}) {
  const supabase = await createClient()
  // Ensure we populate both day_id and journey_day_id if the schema requires it, but typically one is fine. 
  // We'll set both to match the schema safely.
  const { error } = await supabase.from('journey_steps').insert({
    day_id: data.day_id,
    journey_day_id: data.day_id,
    step_order: data.step_order,
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
