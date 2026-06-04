/** Client-queued quest completion (IndexedDB → bulk upsert on reconnect). */
export interface OfflineSubmission {
  /** Client-generated UUID v4 — primary key in Supabase for idempotent sync. */
  id: string;
  questId: string;
  userId: string;
  /** Active expedition room; null when completing casual/global quests. */
  roomId: string | null;
  payload: Record<string, unknown>;
  /** ISO-8601 device clock at completion (remote areas may lack NTP). */
  deviceTimestamp: string;
}

export interface SyncQuestSubmissionsResult {
  successIds: string[];
  rewardedQuestIds: string[];
  error: string | null;
}
