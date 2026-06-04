import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { completeQuestAction } from "@/app/actions/gameActions";
import type { OfflineSubmission } from "@/types/sync";

type RowPayload = {
  id: string;
  quest_id: string;
  user_id: string;
  room_id: string | null;
  payload: Record<string, unknown>;
  device_timestamp: string;
  is_synced: boolean;
  synced_at: string;
  is_approved: boolean;
};

function normalizeSubmission(raw: unknown, authUserId: string): OfflineSubmission | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const id = typeof s.id === "string" ? s.id : null;
  const questId = typeof s.questId === "string" ? s.questId : null;
  const userId = typeof s.userId === "string" ? s.userId : authUserId;
  if (!id || !questId) return null;
  if (userId !== authUserId) return null;

  return {
    id,
    questId,
    userId,
    roomId: typeof s.roomId === "string" ? s.roomId : null,
    payload:
      s.payload && typeof s.payload === "object" && !Array.isArray(s.payload)
        ? (s.payload as Record<string, unknown>)
        : {},
    deviceTimestamp:
      typeof s.deviceTimestamp === "string"
        ? s.deviceTimestamp
        : new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { submissions?: unknown[] };
    const rawList = Array.isArray(body.submissions) ? body.submissions : [];
    const submissions = rawList
      .map((item) => normalizeSubmission(item, user.id))
      .filter((s): s is OfflineSubmission => s !== null);

    if (submissions.length === 0) {
      return NextResponse.json({
        successIds: [],
        rewardedQuestIds: [],
        error: null,
      });
    }

    const now = new Date().toISOString();
    const rows: RowPayload[] = submissions.map((sub) => ({
      id: sub.id,
      quest_id: sub.questId,
      user_id: sub.userId,
      room_id: sub.roomId,
      payload: sub.payload,
      device_timestamp: new Date(sub.deviceTimestamp).toISOString(),
      is_synced: true,
      synced_at: now,
      is_approved: true,
    }));

    const { data: upserted, error: upsertError } = await supabase
      .from("quest_submissions")
      .upsert(rows, { onConflict: "id" })
      .select("id, quest_id");

    if (upsertError) {
      console.error("quest_submissions upsert:", upsertError.message);
      return NextResponse.json(
        { error: upsertError.message, successIds: [], rewardedQuestIds: [] },
        { status: 400 }
      );
    }

    const successIds = (upserted ?? []).map((r) => r.id as string);
    const rewardedQuestIds: string[] = [];

    for (const sub of submissions) {
      const { data: existing } = await supabase
        .from("user_quests")
        .select("id")
        .eq("user_id", user.id)
        .eq("quest_id", sub.questId)
        .maybeSingle();

      if (existing) continue;

      const reward = await completeQuestAction(user.id, sub.questId);
      if (reward?.success) {
        rewardedQuestIds.push(sub.questId);

        if (Object.keys(sub.payload).length > 0) {
          await supabase.from("quest_responses").upsert(
            {
              quest_id: sub.questId,
              user_id: user.id,
              response_data: sub.payload,
              status: "completed",
            },
            { onConflict: "quest_id,user_id" }
          );
        }
      }
    }

    return NextResponse.json({
      successIds,
      rewardedQuestIds,
      error: null,
    });
  } catch (err) {
    console.error("sync/quest-submissions:", err);
    return NextResponse.json(
      { error: "Internal Server Error", successIds: [], rewardedQuestIds: [] },
      { status: 500 }
    );
  }
}
