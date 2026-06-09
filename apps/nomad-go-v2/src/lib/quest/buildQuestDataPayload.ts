import { sha256Hex } from "@/lib/quest/crypto";
import type {
  AdminQuestExecutionType,
  QuestConfigDraft,
} from "@/lib/quest/questAdminTypes";
import { mapAdminTypeToDbType } from "@/lib/quest/questAdminTypes";

export type BuiltQuestDataPayload = {
  dbType: string;
  questData: Record<string, unknown>;
  validationCode: string | null;
};

/**
 * Structures admin form config into the `quest_data` JSON shape
 * expected by `buildQuestExecutionConfig` on `/quests`.
 */
export async function buildQuestDataPayload(
  executionType: AdminQuestExecutionType,
  config: QuestConfigDraft
): Promise<BuiltQuestDataPayload> {
  const dbType = mapAdminTypeToDbType(executionType);

  switch (executionType) {
    case "PHOTO":
      return {
        dbType,
        validationCode: null,
        questData: {
          targetLatitude: Number(config.photo.targetLatitude),
          targetLongitude: Number(config.photo.targetLongitude),
          radiusMeters: Number(config.photo.radiusMeters),
        },
      };

    case "QUIZ":
    case "CHOICE": {
      const correctId = config.quiz.correctOptionId.trim().toLowerCase();
      const answerHash = await sha256Hex(correctId);
      const options = config.quiz.options.map((o) => ({
        id: o.id.trim(),
        label: o.label.trim(),
      }));
      return {
        dbType,
        validationCode: null,
        questData: {
          question: config.quiz.question.trim(),
          options,
          answerHash,
        },
      };
    }

    case "QR_SCAN":
      return {
        dbType,
        validationCode: config.qr.verificationToken.trim(),
        questData: {
          executionKind: "qr",
          verificationToken: config.qr.verificationToken.trim(),
        },
      };

    case "AUDIO":
      return {
        dbType,
        validationCode: null,
        questData: {
          executionKind: "audio",
          prompt: config.audio.prompt.trim() || "Record your voice response",
          maxDurationSeconds: Number(config.audio.maxDurationSeconds) || 30,
        },
      };

    case "TIME_BOUND":
      return {
        dbType,
        validationCode: null,
        questData: {
          windowStart: config.timeBound.windowStart.trim(),
          windowEnd: config.timeBound.windowEnd.trim(),
          timezone: config.timeBound.timezone.trim(),
        },
      };

    default:
      throw new Error(`Unsupported execution type: ${executionType}`);
  }
}

export function serializeQuestDataForLog(payload: BuiltQuestDataPayload): string {
  try {
    return JSON.stringify(
      {
        dbType: payload.dbType,
        validationCode: payload.validationCode,
        questData: payload.questData,
      },
      null,
      2
    );
  } catch (err) {
    console.error("Quest data JSON serialization failed:", err);
    throw new Error("Failed to serialize quest configuration.");
  }
}
