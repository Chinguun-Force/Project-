/** Admin UI execution types → Supabase `quests.type` + `quest_data` columns. */
export type AdminQuestExecutionType =
  | "PHOTO"
  | "AUDIO"
  | "QR_SCAN"
  | "QUIZ"
  | "CHOICE"
  | "TIME_BOUND";

export type QuizOptionDraft = {
  id: string;
  label: string;
};

export type QuestConfigDraft = {
  photo: {
    targetLatitude: string;
    targetLongitude: string;
    radiusMeters: string;
  };
  /** QUIZ = free-text answer. */
  quiz: {
    question: string;
    correctAnswer: string;
  };
  /** CHOICE = multiple-choice test. */
  choice: {
    question: string;
    options: QuizOptionDraft[];
    correctOptionId: string;
  };
  qr: {
    verificationToken: string;
  };
  audio: {
    prompt: string;
    maxDurationSeconds: string;
  };
  timeBound: {
    windowStart: string;
    windowEnd: string;
    timezone: string;
  };
};

export const DEFAULT_QUEST_CONFIG: QuestConfigDraft = {
  photo: { targetLatitude: "47.92", targetLongitude: "106.92", radiusMeters: "50" },
  quiz: {
    question: "",
    correctAnswer: "",
  },
  choice: {
    question: "",
    options: [
      { id: "a", label: "" },
      { id: "b", label: "" },
    ],
    correctOptionId: "",
  },
  qr: { verificationToken: "" },
  audio: { prompt: "Record your voice response", maxDurationSeconds: "30" },
  timeBound: { windowStart: "06:00", windowEnd: "07:00", timezone: "Asia/Ulaanbaatar" },
};

export const QUEST_TIMEZONES = [
  "Asia/Ulaanbaatar",
  "Asia/Hovd",
  "UTC",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Europe/London",
  "America/New_York",
] as const;

const HH_MM = /^([01]?\d|2[0-3]):[0-5]\d$/;

export function mapAdminTypeToDbType(type: AdminQuestExecutionType): string {
  switch (type) {
    case "PHOTO":
      return "photo";
    case "QUIZ":
      return "quiz";
    case "CHOICE":
      return "choice";
    case "QR_SCAN":
    case "AUDIO":
      return "action";
    case "TIME_BOUND":
      return "timer";
    default:
      return "quiz";
  }
}

export function questDataColumnForDbType(dbType: string): string {
  return `${dbType}_data`;
}

export function generateVerificationToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `ng-${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `ng-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function validateQuestConfig(
  executionType: AdminQuestExecutionType,
  config: QuestConfigDraft
): string | null {
  switch (executionType) {
    case "PHOTO": {
      const lat = Number(config.photo.targetLatitude);
      const lng = Number(config.photo.targetLongitude);
      const radius = Number(config.photo.radiusMeters);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return "Photo target latitude must be between -90 and 90.";
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        return "Photo target longitude must be between -180 and 180.";
      }
      if (!Number.isFinite(radius) || radius <= 0) {
        return "Photo radius must be a positive number (meters).";
      }
      return null;
    }
    case "QUIZ": {
      if (!config.quiz.question.trim()) return "Quiz question is required.";
      if (!config.quiz.correctAnswer.trim()) return "Correct answer text is required.";
      return null;
    }
    case "CHOICE": {
      if (!config.choice.question.trim()) return "Question is required.";
      if (config.choice.options.length < 2) return "Add at least two answer options.";
      const ids = new Set<string>();
      for (const opt of config.choice.options) {
        if (!opt.id.trim()) return "Each option needs an ID.";
        if (!opt.label.trim()) return "Each option needs a label.";
        if (ids.has(opt.id.trim())) return "Option IDs must be unique.";
        ids.add(opt.id.trim());
      }
      if (!config.choice.correctOptionId) return "Select the correct option.";
      if (!ids.has(config.choice.correctOptionId)) {
        return "Correct option must match one of the option IDs.";
      }
      return null;
    }
    case "QR_SCAN": {
      if (!config.qr.verificationToken.trim()) {
        return "Verification token is required for QR scan quests.";
      }
      return null;
    }
    case "AUDIO": {
      const max = Number(config.audio.maxDurationSeconds);
      if (!Number.isFinite(max) || max < 5 || max > 120) {
        return "Audio max duration must be between 5 and 120 seconds.";
      }
      return null;
    }
    case "TIME_BOUND": {
      if (!HH_MM.test(config.timeBound.windowStart)) {
        return 'Window start must use "HH:MM" format (e.g. 06:00).';
      }
      if (!HH_MM.test(config.timeBound.windowEnd)) {
        return 'Window end must use "HH:MM" format (e.g. 07:00).';
      }
      if (!config.timeBound.timezone.trim()) return "Timezone is required.";
      return null;
    }
    default:
      return "Unknown quest type.";
  }
}
