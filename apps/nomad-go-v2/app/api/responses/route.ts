import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

type QuestStepType = "check" | "text" | "photo";

type QuestStepConfig = {
  id: string;
  label?: string;
  type: QuestStepType;
  expected_answer?: string;
};

type SubmittedStep = {
  id: string;
  type: QuestStepType;
  answer?: string;
  photo_url?: string;
  completed?: boolean;
};

type QuestResponsePayload = {
  steps?: SubmittedStep[];
  feedback?: {
    text?: string;
    rating?: number;
  };
};

function normalizeQuestType(value: unknown): QuestStepType {
  if (value === "text" || value === "photo") return value;
  return "check";
}

function parseConfiguredSteps(questType: string | null, questDataRow: Record<string, unknown> | null): QuestStepConfig[] {
  const rowSteps = Array.isArray(questDataRow?.steps) ? (questDataRow?.steps as QuestStepConfig[]) : null;
  if (rowSteps && rowSteps.length > 0) {
    return rowSteps.map((step, index) => ({
      id: step.id || `step-${index + 1}`,
      label: step.label,
      type: normalizeQuestType(step.type),
      expected_answer: typeof step.expected_answer === "string" ? step.expected_answer : undefined,
    }));
  }

  return [
    {
      id: "final-step",
      type: normalizeQuestType(questType),
    },
  ];
}

function validateSubmittedSteps(configuredSteps: QuestStepConfig[], submittedSteps: SubmittedStep[]) {
  const submittedById = new Map(submittedSteps.map((step) => [step.id, step]));

  for (const step of configuredSteps) {
    const submitted = submittedById.get(step.id);
    if (!submitted) {
      return `Missing response for step "${step.id}".`;
    }

    if (normalizeQuestType(submitted.type) !== step.type) {
      return `Invalid step type for "${step.id}".`;
    }

    if (step.type === "check" && !submitted.completed) {
      return `Step "${step.id}" must be completed.`;
    }

    if (step.type === "text") {
      const answer = submitted.answer?.trim();
      if (!answer) {
        return `Step "${step.id}" requires an answer.`;
      }
      if (step.expected_answer) {
        const expected = step.expected_answer.trim().toLowerCase();
        if (answer.toLowerCase() !== expected) {
          return `Incorrect answer for "${step.id}".`;
        }
      }
    }

    if (step.type === "photo" && !submitted.photo_url) {
      return `Step "${step.id}" requires a photo upload.`;
    }
  }

  return null;
}

// POST /api/responses - Submit a quest response
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { questId, stepId, responseData } = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('level, current_xp, xp_threshold, total_xp, points, completed_quests')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    const level = profile?.level || 1;
    let currentXp = profile?.current_xp || 0;
    let xpThreshold = profile?.xp_threshold || 1000;
    let totalXp = profile?.total_xp || 0;
    let points = profile?.points || 0;
    let completedQuests = profile?.completed_quests || 0;

    // Journey step completion -> XP reward
    if (stepId) {
      const { data: step, error: stepError } = await supabase
        .from('journey_steps')
        .select('id, xp_reward')
        .eq('id', stepId)
        .maybeSingle();

      if (stepError) return NextResponse.json({ error: stepError.message }, { status: 400 });
      if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 });

      const xpReward = step.xp_reward || 0;
      const nextCurrentXp = currentXp + xpReward;
      totalXp += xpReward;
      currentXp = nextCurrentXp;

      let nextLevel = level;
      while (currentXp >= xpThreshold) {
        currentXp -= xpThreshold;
        nextLevel += 1;
        xpThreshold = Math.round(xpThreshold * 1.15);
      }

      const { error: stepUpdateError } = await supabase
        .from('journey_steps')
        .update({ status: 'completed' })
        .eq('id', stepId);

      if (stepUpdateError) return NextResponse.json({ error: stepUpdateError.message }, { status: 400 });

      const { error: profileUpdateError } = await supabase
        .from('users')
        .update({
          level: nextLevel,
          current_xp: currentXp,
          xp_threshold: xpThreshold,
          total_xp: totalXp,
        })
        .eq('id', user.id);

      if (profileUpdateError) return NextResponse.json({ error: profileUpdateError.message }, { status: 400 });

      return NextResponse.json({
        type: 'step',
        step_id: stepId,
        xp_reward: xpReward,
        level: nextLevel,
        current_xp: currentXp,
        xp_threshold: xpThreshold,
        total_xp: totalXp,
      });
    }

    if (!questId) {
      return NextResponse.json({ error: 'questId or stepId is required' }, { status: 400 });
    }

    // Quest completion -> points reward with level multiplier.
    // Points are granted only after all quest steps are validated.
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, type, point_reward')
      .eq('id', questId)
      .maybeSingle();

    if (questError) return NextResponse.json({ error: questError.message }, { status: 400 });
    if (!quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 });

    const { data: questDataRow, error: questDataError } = await supabase
      .from('quest_data')
      .select('*')
      .eq('quest_id', questId)
      .maybeSingle();
    if (questDataError) return NextResponse.json({ error: questDataError.message }, { status: 400 });

    const payload = (responseData || {}) as QuestResponsePayload;
    const configuredSteps = parseConfiguredSteps(quest.type ?? null, (questDataRow as Record<string, unknown> | null) ?? null);
    const submittedSteps = Array.isArray(payload.steps) ? payload.steps : [];
    const validationError = validateSubmittedSteps(configuredSteps, submittedSteps);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const basePointReward = quest.point_reward || 0;
    const multiplier = 1 + (level * 0.1);
    const finalPoints = Math.round(basePointReward * multiplier);

    const { data, error } = await supabase
      .from('quest_responses')
      .upsert({
        quest_id: questId,
        user_id: user.id,
        response_data: responseData || {},
        status: 'completed'
      }, { onConflict: 'quest_id,user_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const feedbackText = payload.feedback?.text?.trim() || "";
    const feedbackRating = payload.feedback?.rating;
    const hasFeedback = feedbackText.length > 0 || typeof feedbackRating === "number";
    if (hasFeedback) {
      const { error: feedbackError } = await supabase.from("feedbacks").insert({
        quest_id: questId,
        user_id: user.id,
        feedback_text: feedbackText || null,
        rating: typeof feedbackRating === "number" ? feedbackRating : null,
      });
      if (feedbackError) {
        return NextResponse.json({ error: feedbackError.message }, { status: 400 });
      }
    }

    points += finalPoints;
    completedQuests += 1;
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        points,
        completed_quests: completedQuests,
      })
      .eq('id', user.id);

    if (userUpdateError) return NextResponse.json({ error: userUpdateError.message }, { status: 400 });

    return NextResponse.json({
      ...data,
      point_reward: finalPoints,
      base_point_reward: basePointReward,
      multiplier,
      points,
      completed_quests: completedQuests,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/responses?sessionId=... - Get user's responses for a specific session
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: responses, error } = await supabase
    .from('quest_responses')
    .select('*, quests!inner(session_id)')
    .eq('user_id', user.id)
    .eq('quests.session_id', sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(responses);
}
