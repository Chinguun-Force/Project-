import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import {
  completeJourneyStepAction,
  completeQuestAction,
} from '@/app/actions/gameActions';
import { DEFAULT_QUEST_XP_REWARD } from '@/lib/gamification';

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

    // Journey / mission step -> centralized rewards engine
    if (stepId) {
      const result = await completeJourneyStepAction(user.id, stepId);
      if (!result.success) {
        return NextResponse.json(
          { error: 'error' in result ? result.error : 'Step completion failed' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        type: 'step',
        step_id: stepId,
        xp_reward: result.finalXpReward,
        point_reward: result.finalPointReward,
        level: result.newLevel,
        has_leveled_up: result.hasLeveledUp,
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

    const rewardResult = await completeQuestAction(user.id, questId);
    if (!rewardResult.success) {
      return NextResponse.json(
        { error: 'error' in rewardResult ? rewardResult.error : 'Quest reward failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...data,
      xp_reward: rewardResult.finalXpReward,
      point_reward: rewardResult.finalPointReward,
      base_xp_reward: DEFAULT_QUEST_XP_REWARD,
      base_point_reward: quest.point_reward || 0,
      level: rewardResult.newLevel,
      has_leveled_up: rewardResult.hasLeveledUp,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/responses — user's quest responses (sessionId query deprecated, ignored)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: responses, error } = await supabase
    .from("quest_responses")
    .select("*")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(responses);
}
