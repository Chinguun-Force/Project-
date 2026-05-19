import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const payload = {
    day_id: body.day_id,
    step_order: body.step_order,
    time: body.time ?? null,
    title: body.title,
    subtitle: body.subtitle ?? null,
    description: body.description ?? null,
    type: body.type ?? "travel",
    xp_reward: body.xp_reward ?? 0,
    status: body.status ?? "pending",
  };

  const { data, error } = await supabase.from("journey_steps").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const stepId = body.step_id as string | undefined;
  const sessionId = body.session_id as string | undefined;

  if (!stepId || !sessionId) {
    return NextResponse.json({ error: "step_id and session_id are required" }, { status: 400 });
  }

  const { data: step, error: stepError } = await supabase
    .from("journey_steps")
    .select("id, xp_reward, status")
    .eq("id", stepId)
    .maybeSingle();

  if (stepError) return NextResponse.json({ error: stepError.message }, { status: 400 });
  if (!step) return NextResponse.json({ error: "Step not found" }, { status: 404 });
  if (step.status === "completed") {
    return NextResponse.json({
      success: true,
      step_id: stepId,
      status: "completed",
      xp_reward: step.xp_reward || 0,
      rewarded_users: 0,
      note: "Step was already completed",
    });
  }

  const { error: stepUpdateError } = await supabase
    .from("journey_steps")
    .update({ status: "completed" })
    .eq("id", stepId);
  if (stepUpdateError) return NextResponse.json({ error: stepUpdateError.message }, { status: 400 });

  const xpReward = step.xp_reward || 0;
  const userIdSet = new Set<string>();

  // 1) Try to resolve enrolled users from session_participants table.
  const { data: participants, error: participantError } = await supabase
    .from("session_participants")
    .select("user_id")
    .eq("session_id", sessionId);

  if (!participantError) {
    (participants ?? [])
      .map((participant) => participant.user_id as string | null)
      .filter((id): id is string => !!id)
      .forEach((id) => userIdSet.add(id));
  }

  // 2) Fallback participant discovery from quest activity for this session.
  const { data: sessionQuests } = await supabase
    .from("quests")
    .select("id")
    .eq("session_id", sessionId);
  const questIds = (sessionQuests ?? []).map((quest) => quest.id as string).filter(Boolean);

  if (questIds.length > 0) {
    const { data: userQuests } = await supabase
      .from("user_quests")
      .select("user_id")
      .in("quest_id", questIds);
    (userQuests ?? [])
      .map((row) => row.user_id as string | null)
      .filter((id): id is string => !!id)
      .forEach((id) => userIdSet.add(id));

    const { data: questResponses } = await supabase
      .from("quest_responses")
      .select("user_id")
      .in("quest_id", questIds);
    (questResponses ?? [])
      .map((row) => row.user_id as string | null)
      .filter((id): id is string => !!id)
      .forEach((id) => userIdSet.add(id));
  }

  // 3) Always include guide as enrolled operator.
  const { data: session } = await supabase
      .from("sessions")
      .select("guide_id")
      .eq("id", sessionId)
      .maybeSingle();
  if (session?.guide_id) userIdSet.add(session.guide_id as string);

  const userIds = Array.from(userIdSet);

  // Grant XP to all resolved users with level-up carry-over.
  await Promise.all(
    userIds.map(async (userId) => {
      const { data: profile } = await supabase
        .from("users")
        .select("level, current_xp, xp_threshold, total_xp")
        .eq("id", userId)
        .maybeSingle();

      const currentLevel = profile?.level || 1;
      let currentXp = profile?.current_xp || 0;
      let xpThreshold = profile?.xp_threshold || 1000;
      let totalXp = profile?.total_xp || 0;

      currentXp += xpReward;
      totalXp += xpReward;
      let level = currentLevel;

      while (currentXp >= xpThreshold) {
        currentXp -= xpThreshold;
        level += 1;
        xpThreshold = Math.round(xpThreshold * 1.15);
      }

      await supabase
        .from("users")
        .update({
          level,
          current_xp: currentXp,
          xp_threshold: xpThreshold,
          total_xp: totalXp,
        })
        .eq("id", userId);
    })
  );

  return NextResponse.json({
    success: true,
    step_id: stepId,
    status: "completed",
    xp_reward: xpReward,
    rewarded_users: userIds.length,
  });
}

