import type { QuestExecutionConfig, QuestExecutionType } from "@/types/questExecution";

type QuestDataRow = {
  quiz_data?: unknown;
  photo_data?: unknown;
  action_data?: unknown;
  choice_data?: unknown;
  timer_data?: unknown;
  validation_code?: string | null;
};

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

/** Maps legacy DB quest `type` to execution engine enum. */
export function mapDbQuestTypeToExecution(
  dbType: string | null | undefined
): QuestExecutionType | null {
  switch (dbType) {
    case "photo":
      return "PHOTO";
    case "quiz":
    case "choice":
      return "QUIZ";
    case "timer":
      return "TIME_BOUND";
    case "action":
      return "QR_SCAN";
    default:
      return null;
  }
}

export function isExecutableQuestType(dbType: string | null | undefined): boolean {
  return mapDbQuestTypeToExecution(dbType) !== null;
}

/**
 * Builds execution config from `quest_data` row + optional mission geofence.
 */
function resolveExecutionType(
  dbType: string,
  row: QuestDataRow
): QuestExecutionType | null {
  if (dbType === "action") {
    const action = (row.action_data ?? {}) as Record<string, unknown>;
    if (action.executionKind === "audio") return "AUDIO";
    return "QR_SCAN";
  }
  return mapDbQuestTypeToExecution(dbType);
}

export function buildQuestExecutionConfig(
  dbType: string,
  questData: QuestDataRow | null | undefined,
  missionCoords?: { latitude: number; longitude: number; radiusMeters: number } | null
): QuestExecutionConfig | null {
  const row = questData ?? {};
  const executionType = resolveExecutionType(dbType, row);
  if (!executionType) return null;

  if (executionType === "PHOTO") {
    const photo = (row.photo_data ?? {}) as Record<string, unknown>;
    const lat = num(
      photo.targetLatitude ?? photo.latitude ?? photo.lat ?? missionCoords?.latitude,
      NaN
    );
    const lng = num(
      photo.targetLongitude ?? photo.longitude ?? photo.lng ?? missionCoords?.longitude,
      NaN
    );
    const radius = num(
      photo.radiusMeters ?? photo.radius_meters ?? missionCoords?.radiusMeters,
      50
    );
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      type: "PHOTO",
      photo: { targetLatitude: lat, targetLongitude: lng, radiusMeters: radius },
    };
  }

  if (executionType === "QUIZ") {
    const raw = (row.quiz_data ?? row.choice_data ?? {}) as Record<string, unknown>;
    const options = Array.isArray(raw.options)
      ? (raw.options as Array<Record<string, unknown>>).map((o, i) => ({
          id: str(o.id, `opt-${i}`),
          label: str(o.label ?? o.text, `Option ${i + 1}`),
        }))
      : [];
    const answerHash = str(raw.answerHash ?? raw.correctAnswerHash ?? raw.answer_hash);
    const question = str(raw.question ?? raw.prompt, "Answer the quest question");
    if (!answerHash || options.length === 0) return null;
    return { type: "QUIZ", quiz: { question, options, answerHash } };
  }

  if (executionType === "QR_SCAN") {
    const action = (row.action_data ?? {}) as Record<string, unknown>;
    const token = str(
      action.verificationToken ?? action.token ?? row.validation_code
    );
    if (!token) return null;
    return { type: "QR_SCAN", qr: { verificationToken: token } };
  }

  if (executionType === "TIME_BOUND") {
    const timer = (row.timer_data ?? {}) as Record<string, unknown>;
    const windowStart = str(timer.windowStart ?? timer.start ?? timer.start_time, "06:00");
    const windowEnd = str(timer.windowEnd ?? timer.end ?? timer.end_time, "07:00");
    const timezone = str(timer.timezone ?? timer.tz, "") || undefined;
    return { type: "TIME_BOUND", timeBound: { windowStart, windowEnd, timezone } };
  }

  if (executionType === "AUDIO") {
    const audio = (row.action_data ?? {}) as Record<string, unknown>;
    return {
      type: "AUDIO",
      audio: {
        maxDurationSeconds: num(audio.maxDurationSeconds, 30),
        prompt: str(audio.prompt, "Record your voice response"),
      },
    };
  }

  return null;
}

export function resolveQuestExecutionType(
  dbType: string,
  questData: QuestDataRow | null | undefined
): QuestExecutionType | null {
  return resolveExecutionType(dbType, questData ?? {});
}
