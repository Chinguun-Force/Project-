"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SyncManager } from "@/lib/offline/syncManager";
import { countPendingSubmissions } from "@/lib/offline/idb";
import { toast } from "sonner";

export function useOfflineSync() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const n = await countPendingSubmissions();
      setPendingCount(n);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const flush = useCallback(async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      const result = await SyncManager.flushPending();
      await refreshPendingCount();
      if (result.error) return;
      if (result.successIds.length > 0) {
        toast.success(
          `Synced ${result.successIds.length} offline quest${result.successIds.length > 1 ? "s" : ""}.`
        );
        window.dispatchEvent(new CustomEvent("nomad:stats-refresh"));
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!user?.id) return;

    const onOnline = () => {
      void flush();
    };

    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [user?.id, flush]);

  useEffect(() => {
    const onQueued = () => refreshPendingCount();
    window.addEventListener("nomad:offline-queued", onQueued);
    return () => window.removeEventListener("nomad:offline-queued", onQueued);
  }, [refreshPendingCount]);

  return { pendingCount, isSyncing, flush, refreshPendingCount };
}
