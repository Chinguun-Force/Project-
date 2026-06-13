/** Client-side quest execution types (maps from DB: photo, quiz, choice, timer, action). */
export type QuestExecutionType =
  | "PHOTO"
  | "AUDIO"
  | "QR_SCAN"
  | "QUIZ"
  | "TIME_BOUND";

export type OfflineSubmissionStatus = "local_valid" | "pending_sync";

export interface OfflineSubmissionRecord {
  id: string;
  questId: string;
  roomId: string;
  type: QuestExecutionType;
  payload: Record<string, unknown>;
  deviceTimestamp: string;
  status: OfflineSubmissionStatus;
  /** Bridged to legacy sync queue — not stored in Dexie schema per spec. */
  userId?: string;
}

export type PhotoQuestConfig = {
  targetLatitude: number;
  targetLongitude: number;
  radiusMeters: number;
};

export type AudioQuestConfig = {
  maxDurationSeconds?: number;
  prompt?: string;
};

export type QrScanQuestConfig = {
  verificationToken: string;
};

export type QuizOption = {
  id: string;
  label: string;
};

export type QuizAnswerMode = "text" | "choice";

export type QuizQuestConfig = {
  question: string;
  /** "text" = free-text answer; "choice" = multiple-choice options. */
  mode: QuizAnswerMode;
  /** Present only for choice mode. */
  options?: QuizOption[];
  /** SHA-256 hex of canonical answer (option id for choice, lowercased text for text). */
  answerHash: string;
};

export type TimeBoundQuestConfig = {
  windowStart: string;
  windowEnd: string;
  /** IANA timezone; defaults to device local. */
  timezone?: string;
};

export type QuestExecutionConfig =
  | { type: "PHOTO"; photo: PhotoQuestConfig }
  | { type: "AUDIO"; audio: AudioQuestConfig }
  | { type: "QR_SCAN"; qr: QrScanQuestConfig }
  | { type: "QUIZ"; quiz: QuizQuestConfig }
  | { type: "TIME_BOUND"; timeBound: TimeBoundQuestConfig };

export type QuestEngineSuccess = {
  submission: OfflineSubmissionRecord;
  message?: string;
};

export type QuestEngineFailure = {
  submission: null;
  error: string;
  code?: "OUT_OF_RADIUS" | "OUT_OF_WINDOW" | "INVALID_QR" | "INVALID_QUIZ" | "VALIDATION";
};

export type QuestEngineResult = QuestEngineSuccess | QuestEngineFailure;
