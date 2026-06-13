import exifr from "exifr";
import type {
  AudioQuestConfig,
  OfflineSubmissionRecord,
  PhotoQuestConfig,
  QrScanQuestConfig,
  QuestEngineFailure,
  QuestEngineResult,
  QuizQuestConfig,
  TimeBoundQuestConfig,
} from "@/types/questExecution";
import {
  buildOfflineSubmissionRecord,
  saveOfflineSubmission,
} from "@/lib/offline/dexieDb";
import { enqueuePendingSubmission } from "@/lib/offline/idb";
import { SyncManager } from "@/lib/offline/syncManager";
import type { OfflineSubmission } from "@/types/sync";
import { isWithinRadiusMeters } from "@/lib/quest/haversine";
import { verifyHashedAnswer } from "@/lib/quest/crypto";
import { blobToBase64 } from "@/lib/quest/mediaUtils";

type BaseExecuteInput = {
  questId: string;
  roomId: string;
  userId: string;
  deviceTimestamp?: string;
};

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function failure(
  error: string,
  code?: QuestEngineFailure["code"]
): QuestEngineFailure {
  return { submission: null, error, code };
}

async function persistAndBridge(
  record: OfflineSubmissionRecord
): Promise<OfflineSubmissionRecord> {
  await saveOfflineSubmission(record);

  if (record.userId) {
    const syncPayload: OfflineSubmission = {
      id: record.id,
      questId: record.questId,
      userId: record.userId,
      roomId: record.roomId || null,
      deviceTimestamp: record.deviceTimestamp,
      payload: {
        ...record.payload,
        executionType: record.type,
        offlineStatus: record.status,
      },
    };
    await enqueuePendingSubmission(syncPayload);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nomad:offline-queued"));
    }
    if (!isOffline()) {
      void SyncManager.flushPending();
    }
  }

  return record;
}

async function success(
  input: BaseExecuteInput & {
    type: OfflineSubmissionRecord["type"];
    status: OfflineSubmissionRecord["status"];
    payload: Record<string, unknown>;
    message?: string;
  }
): Promise<QuestEngineResult> {
  const record = buildOfflineSubmissionRecord({
    questId: input.questId,
    roomId: input.roomId,
    type: input.type,
    payload: input.payload,
    status: input.status,
    userId: input.userId,
    deviceTimestamp: input.deviceTimestamp,
  });
  const saved = await persistAndBridge(record);
  return { submission: saved, message: input.message };
}

type GpsCoordinates = { latitude: number; longitude: number };

async function extractExifGps(file: File): Promise<GpsCoordinates | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") {
      return null;
    }
    return { latitude: gps.latitude, longitude: gps.longitude };
  } catch {
    return null;
  }
}

/** PHOTO — EXIF GPS + Haversine radius; missing EXIF offline → pending_sync. */
export async function executePhotoQuest(
  input: BaseExecuteInput & { file: File; config: PhotoQuestConfig }
): Promise<QuestEngineResult> {
  try {
    const imageBase64 = await blobToBase64(input.file);
    const gps = await extractExifGps(input.file);
    const offline = isOffline();

    if (!gps) {
      if (offline) {
        return success({
          ...input,
          type: "PHOTO",
          status: "pending_sync",
          payload: {
            imageBase64,
            exifMissing: true,
            targetLatitude: input.config.targetLatitude,
            targetLongitude: input.config.targetLongitude,
            radiusMeters: input.config.radiusMeters,
          },
          message: "Photo cached — GPS validation will complete when synced.",
        });
      }
      return success({
        ...input,
        type: "PHOTO",
        status: "pending_sync",
        payload: {
          imageBase64,
          exifMissing: true,
          targetLatitude: input.config.targetLatitude,
          targetLongitude: input.config.targetLongitude,
          radiusMeters: input.config.radiusMeters,
        },
        message: "Photo saved — awaiting GPS verification on sync.",
      });
    }

    const inRange = isWithinRadiusMeters(
      gps.latitude,
      gps.longitude,
      input.config.targetLatitude,
      input.config.targetLongitude,
      input.config.radiusMeters
    );

    if (!inRange) {
      return failure(
        `Photo location is outside the ${input.config.radiusMeters}m quest radius.`,
        "OUT_OF_RADIUS"
      );
    }

    return success({
      ...input,
      type: "PHOTO",
      status: "local_valid",
      payload: {
        imageBase64,
        latitude: gps.latitude,
        longitude: gps.longitude,
        radiusMeters: input.config.radiusMeters,
      },
      message: "Photo verified at quest location.",
    });
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Photo validation failed");
  }
}

/** AUDIO — MediaRecorder blob → base64; always pending_sync for Whisper backend. */
export async function executeAudioQuest(
  input: BaseExecuteInput & { audioBlob: Blob; config: AudioQuestConfig }
): Promise<QuestEngineResult> {
  try {
    const audioBase64 = await blobToBase64(input.audioBlob);
    return success({
      ...input,
      type: "AUDIO",
      status: "pending_sync",
      payload: {
        audioBase64,
        mimeType: input.audioBlob.type,
        maxDurationSeconds: input.config.maxDurationSeconds ?? 30,
        prompt: input.config.prompt,
      },
      message: "Voice captured — transcription syncs when online.",
    });
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Audio capture failed");
  }
}

/** QR_SCAN — secure token match → local_valid. */
export async function executeQrScanQuest(
  input: BaseExecuteInput & { scannedContent: string; config: QrScanQuestConfig }
): Promise<QuestEngineResult> {
  const scanned = input.scannedContent.trim();
  const expected = input.config.verificationToken.trim();

  if (!scanned || scanned !== expected) {
    return failure("QR code does not match this quest's verification token.", "INVALID_QR");
  }

  return success({
    ...input,
    type: "QR_SCAN",
    status: "local_valid",
    payload: { scannedContent: scanned, verified: true },
    message: "Guide QR verified locally.",
  });
}

/** QUIZ — SHA-256 answer hash check → local_valid. Handles free-text and choice. */
export async function executeQuizQuest(
  input: BaseExecuteInput & { answer: string; config: QuizQuestConfig }
): Promise<QuestEngineResult> {
  try {
    const candidate = input.answer.trim();
    if (!candidate) {
      return failure("Please enter an answer.", "INVALID_QUIZ");
    }

    const valid = await verifyHashedAnswer(candidate, input.config.answerHash);
    if (!valid) {
      return failure("Incorrect answer — try again.", "INVALID_QUIZ");
    }

    return success({
      ...input,
      type: "QUIZ",
      status: "local_valid",
      payload: {
        answer: candidate,
        mode: input.config.mode,
        question: input.config.question,
      },
      message: "Knowledge check passed.",
    });
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Quiz validation failed");
  }
}

function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function deviceMinutesInTimezone(isoTimestamp: string, timezone?: string): number {
  const date = new Date(isoTimestamp);
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).formatToParts(date);
      const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
      const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
      return hour * 60 + minute;
    } catch {
      // fall through to local
    }
  }
  return date.getHours() * 60 + date.getMinutes();
}

function isWithinTimeWindow(
  deviceTimestamp: string,
  config: TimeBoundQuestConfig
): boolean {
  const start = parseTimeToMinutes(config.windowStart);
  const end = parseTimeToMinutes(config.windowEnd);
  if (start === null || end === null) return false;

  const nowMin = deviceMinutesInTimezone(deviceTimestamp, config.timezone);

  if (start <= end) {
    return nowMin >= start && nowMin <= end;
  }
  // Overnight window (e.g. 22:00 – 06:00)
  return nowMin >= start || nowMin <= end;
}

/** TIME_BOUND — strict execution window on deviceTimestamp. */
export async function executeTimeBoundQuest(
  input: BaseExecuteInput & { config: TimeBoundQuestConfig }
): Promise<QuestEngineResult> {
  const deviceTimestamp = input.deviceTimestamp ?? new Date().toISOString();

  if (!isWithinTimeWindow(deviceTimestamp, input.config)) {
    return failure(
      `Quest can only be completed between ${input.config.windowStart} and ${input.config.windowEnd}.`,
      "OUT_OF_WINDOW"
    );
  }

  return success({
    ...input,
    deviceTimestamp,
    type: "TIME_BOUND",
    status: "local_valid",
    payload: {
      windowStart: input.config.windowStart,
      windowEnd: input.config.windowEnd,
      timezone: input.config.timezone ?? "device-local",
    },
    message: "Streak window verified.",
  });
}

export function isQuestEngineSuccess(
  result: QuestEngineResult
): result is Extract<QuestEngineResult, { submission: OfflineSubmissionRecord }> {
  return result.submission !== null;
}
