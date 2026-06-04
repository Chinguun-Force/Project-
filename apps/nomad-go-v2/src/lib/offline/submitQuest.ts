import type { OfflineSubmission } from "@/types/sync";
import { enqueuePendingSubmission } from "@/lib/offline/idb";
import { SyncManager } from "@/lib/offline/syncManager";

export type SubmitQuestOptions = {
  roomId?: string | null;
  payload?: Record<string, unknown>;
};

function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Queue quest completion locally (client UUID + device_timestamp).
 * Attempts immediate sync when online; returns pending id for optimistic UI.
 */
export async function submitQuestOffline(
  userId: string,
  questId: string,
  options: SubmitQuestOptions = {}
): Promise<{ submissionId: string; synced: boolean; error?: string }> {
  const submission: OfflineSubmission = {
    id: newSubmissionId(),
    questId,
    userId,
    roomId: options.roomId ?? null,
    payload: options.payload ?? {},
    deviceTimestamp: new Date().toISOString(),
  };

  await enqueuePendingSubmission(submission);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nomad:offline-queued"));
  }

  if (typeof navigator !== "undefined" && navigator.onLine) {
    const result = await SyncManager.flushPending();
    const synced = result.successIds.includes(submission.id);
    if (synced && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nomad:stats-refresh"));
    }
    return {
      submissionId: submission.id,
      synced,
      error: synced ? undefined : result.error ?? undefined,
    };
  }

  return { submissionId: submission.id, synced: false };
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
