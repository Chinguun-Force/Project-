"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { clearLegacySessionMetadataAction } from "@/app/actions/gameActions";
import { AlertTriangle } from "lucide-react";

export function LegacySessionMigrateBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [cleared, setCleared] = useState(false);

  const hasLegacySession =
    Boolean(user?.user_metadata?.session_id) && !user?.user_metadata?.room_id;

  useEffect(() => {
    if (!hasLegacySession || cleared) return;
    clearLegacySessionMetadataAction().then((res) => {
      if (res && "cleared" in res && res.cleared) {
        setCleared(true);
        router.refresh();
      }
    });
  }, [hasLegacySession, cleared]);

  if (!hasLegacySession || dismissed) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex gap-3 items-start">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-amber-100/90">
        <p className="font-semibold text-amber-200">Expedition codes have changed</p>
        <p className="mt-1 text-amber-100/80">
          Your old invite link no longer works. Enter the new{" "}
          <span className="font-mono font-semibold">room code</span> from your tour operator
          below to rejoin your group.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-xs text-amber-300/80 hover:text-amber-200 shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}
