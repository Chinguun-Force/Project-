import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';

type JourneyStep = {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  description?: string;
  type?: string;
  xp?: number;
};

type JourneyDay = {
  day: number;
  title: string;
  location?: string;
  steps?: JourneyStep[];
};

type JourneyPayload = {
  journeyTitle: string;
  days: JourneyDay[];
};

function isJourneyPayload(value: unknown): value is JourneyPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<JourneyPayload>;
  return typeof record.journeyTitle === 'string' && Array.isArray(record.days);
}

function makeInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getIsoDateFromOffset(daysOffset: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const journey = isJourneyPayload(body)
      ? body
      : isJourneyPayload((body as { journey?: unknown })?.journey)
      ? (body as { journey: JourneyPayload }).journey
      : null;

    const name =
      body?.name ??
      journey?.journeyTitle ??
      'Untitled Journey';

    const location =
      body?.location ??
      journey?.days?.[0]?.location ??
      'TBD';

    const computedTripLength = Math.max((journey?.days?.length ?? 1) - 1, 0);
    const startDate = body?.startDate ?? getIsoDateFromOffset(0);
    const endDate = body?.endDate ?? getIsoDateFromOffset(computedTripLength);
    const inviteCode = body?.inviteCode ?? makeInviteCode();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a guide (in a real app, you'd check their role in the users table)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'guide') {
      // For MVP, we might allow any logged-in user to create a session if role isn't set yet, 
      // but let's be strict or handle the first-time setup.
    }

    const baseInsertPayload = {
      name,
      location,
      start_date: startDate,
      end_date: endDate,
      guide_id: user.id,
      invite_code: inviteCode,
      is_active: true,
    };

    // Backward-compatible storage:
    // - Existing projects work with base fields.
    // - If `journey_data` exists in DB, full journey JSON is persisted too.
    let session;
    let error;

    if (journey) {
      const insertWithJourney = await supabase
        .from('sessions')
        .insert({
          ...baseInsertPayload,
          journey_data: journey,
        })
        .select()
        .single();

      session = insertWithJourney.data;
      error = insertWithJourney.error;
    }

    if (!session || error) {
      const insertBase = await supabase
        .from('sessions')
        .insert(baseInsertPayload)
        .select()
        .single();

      session = insertBase.data;
      error = insertBase.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/sessions - List sessions for the current guide
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Use service role for the nested journey read to avoid RLS blocking related tables
  // while still requiring an authenticated user.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const { url } = getSupabaseConfig();
  const service = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = service
    .from('sessions')
    // Use explicit FK hints to avoid PostgREST relationship ambiguity/cache issues.
    .select('*, journey_days!journey_days_session_id_fkey(*, journey_steps!journey_steps_day_id_fkey(*))')
    .order('created_at', { ascending: false });

  // For MVP: non-admin users can see active sessions (so Quests/Progress work).
  // Admin can see everything.
  if (profile?.role !== "admin") {
    query = query.eq("is_active", true);
  }

  const { data: sessions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(sessions);
}
