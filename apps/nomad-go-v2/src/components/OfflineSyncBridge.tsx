"use client";

import { useOfflineSync } from "@/hooks/useOfflineSync";

/** Mount once in root layout — listens for `online` and flushes IndexedDB queue. */
export function OfflineSyncBridge() {
  const { pendingCount, isSyncing } = useOfflineSync();

  if (pendingCount === 0) return null;

  return (
    <div
      className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs text-emerald-200 backdrop-blur-md"
      role="status"
    >
      {isSyncing
        ? "Syncing offline quests…"
        : `${pendingCount} quest${pendingCount > 1 ? "s" : ""} waiting to sync`}
    </div>
  );
}
