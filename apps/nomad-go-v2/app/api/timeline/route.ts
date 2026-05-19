import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/timeline?sessionId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const supabase = await createClient();
  
  const { data: timeline, error } = await supabase
    .from('timeline_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('day_number', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(timeline);
}

// POST /api/timeline
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { sessionId, dayNumber, timeSlot, title, description, questId, tipId } = body;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: session } = await supabase
      .from('sessions')
      .select('guide_id')
      .eq('id', sessionId)
      .single();

    if (session?.guide_id !== user.id) {
      return NextResponse.json({ error: 'Only the guide can manage the timeline' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('timeline_items')
      .insert({
        session_id: sessionId,
        day_number: dayNumber,
        time_slot: timeSlot,
        title,
        description,
        quest_id: questId,
        tip_id: tipId
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
