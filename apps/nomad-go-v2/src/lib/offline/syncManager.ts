import type { OfflineSubmission, SyncQuestSubmissionsResult } from "@/types/sync";
import {
  listPendingSubmissions,
  removePendingByIds,
} from "@/lib/offline/idb";

let flushInFlight: Promise<SyncQuestSubmissionsResult> | null = null;

/**
 * Bulk-upserts pending offline quest submissions via authenticated API.
 * Idempotent: server uses client UUID as primary key.
 */
export class SyncManager {
  public static async syncOfflineSubmissions(
    submissions?: OfflineSubmission[]
  ): Promise<SyncQuestSubmissionsResult> {
    const queue = submissions ?? (await listPendingSubmissions());
    if (queue.length === 0) {
      return { successIds: [], rewardedQuestIds: [], error: null };
    }

    try {
      const res = await fetch("/api/sync/quest-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ submissions: queue }),
      });

      const body = (await res.json()) as SyncQuestSubmissionsResult & { error?: string };

      if (!res.ok) {
        return {
          successIds: [],
          rewardedQuestIds: [],
          error: body.error ?? `Sync failed (${res.status})`,
        };
      }

      if (body.successIds?.length) {
        await removePendingByIds(body.successIds);
      }

      return {
        successIds: body.successIds ?? [],
        rewardedQuestIds: body.rewardedQuestIds ?? [],
        error: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync network error";
      console.error("CRITICAL: Sync failure during background data processing.", err);
      return { successIds: [], rewardedQuestIds: [], error: message };
    }
  }

  /** Flush IndexedDB queue (deduped concurrent calls). */
  public static async flushPending(): Promise<SyncQuestSubmissionsResult> {
    if (flushInFlight) return flushInFlight;
    flushInFlight = this.syncOfflineSubmissions().finally(() => {
      flushInFlight = null;
    });
    return flushInFlight;
  }
}
