import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';

// GET /api/quests — global + casual quests (sessionId query ignored; deprecated)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const _legacySessionId = searchParams.get('sessionId');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const { url } = getSupabaseConfig();
  const service = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  
  let query = service
    .from('quests')
    .select('*')
    .order('created_at', { ascending: true });

  query = query.is('session_id', null);

  const { data: quests, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const questIds = (quests ?? []).map((quest) => quest.id);
  let questDataByQuestId = new Map<string, unknown>();
  let userQuestStatusByQuestId = new Map<string, string>();

  if (questIds.length > 0) {
    const { data: questDataRows, error: questDataError } = await service
      .from('quest_data')
      .select('*')
      .in('quest_id', questIds);
    if (questDataError) {
      return NextResponse.json({ error: questDataError.message }, { status: 400 });
    }

    questDataByQuestId = new Map(
      (questDataRows ?? []).map((row) => [row.quest_id as string, row])
    );

    const { data: userQuests, error: userQuestsError } = await service
      .from('user_quests')
      .select('quest_id, status')
      .eq('user_id', user.id)
      .in('quest_id', questIds);

    if (!userQuestsError) {
      userQuestStatusByQuestId = new Map(
        (userQuests ?? []).map((row) => [row.quest_id as string, row.status as string])
      );
    } else {
      // Backward compatibility: older schema may still use quest_responses.
      const { data: questResponses, error: questResponsesError } = await service
        .from('quest_responses')
        .select('quest_id, status')
        .eq('user_id', user.id)
        .in('quest_id', questIds);

      if (!questResponsesError) {
        userQuestStatusByQuestId = new Map(
          (questResponses ?? []).map((row) => [row.quest_id as string, row.status as string])
        );
      }
    }
  }

  // Filter available quests based on time (logic can be here or in a utility)
  const now = new Date();
  const availableQuests = quests.filter(q => {
    if (!q.available_from) return true;
    return new Date(q.available_from) <= now;
  });

  const questsWithData = availableQuests.map((quest) => ({
    ...quest,
    quest_type: quest.type ?? "check",
    point_reward: quest.point_reward || 0,
    category: quest.category || 'daily',
    icon: quest.icon || '🧭',
    difficulty: quest.difficulty || 'available',
    location: quest.location || quest.location_name || 'Unknown',
    status: userQuestStatusByQuestId.get(quest.id) ?? quest.status ?? 'active',
    quest_data: questDataByQuestId.get(quest.id) ?? null,
  }));

  const visibleQuests = questsWithData.filter((quest) => {
    const status = quest.status ?? 'active';
    return status !== 'completed' && (status === 'active' || status === 'available');
  });

  return NextResponse.json(visibleQuests);
}

// POST /api/quests — legacy session-scoped quest creation removed
export async function POST() {
  const { legacySessionDeprecatedResponse } = await import("@/lib/legacy/deprecated");
  return legacySessionDeprecatedResponse();
}
