import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';

// GET /api/progress?sessionId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const { url } = getSupabaseConfig();
  const service = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error } = await service
    .from('users')
    .select('level, current_xp, xp_threshold, total_xp, points, completed_quests, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    level: profile?.level || 1,
    current_xp: profile?.current_xp || 0,
    xp_threshold: profile?.xp_threshold || 1000,
    total_xp: profile?.total_xp || 0,
    points: profile?.points || 0,
    available_points: profile?.points || 0,
    completed_quests: profile?.completed_quests || 0,
    avatar_url: profile?.avatar_url || null,
    sessionId,
  });
}
