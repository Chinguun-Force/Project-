import { useCallback, useEffect, useRef, useState } from "react";
import { MISSION_DWELL_MS } from "@/lib/missionDwell";

export { MISSION_DWELL_MS };

type DwellMission = {
  id: string;
  radius_meters?: number | null;
};

type UseMissionDwellArgs = {
  missions: DwellMission[];
  /** mission id → metres from user (from useGeolocation). */
  distances: Record<string, number>;
  completedIds: Set<string>;
  dwellMs?: number;
  /** Persist entry timestamps so dwell survives backgrounding/refresh (per user). */
  storageNamespace?: string;
  onComplete: (missionId: string) => void;
  /** Fired once when the user newly enters a mission radius (not on dwell restore). */
  onEnterRadius?: (missionId: string) => void;
};

type EnteredMap = Record<string, number>;

function storageKey(ns?: string) {
  return ns ? `nomad:mission-dwell:${ns}` : null;
}

function loadEntered(ns?: string): EnteredMap {
  const key = storageKey(ns);
  if (!key || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EnteredMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistEntered(ns: string | undefined, map: EnteredMap) {
  const key = storageKey(ns);
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // storage full / unavailable — degrade silently
  }
}

/**
 * Fires `onComplete` once the wall-clock time since the user first entered a
 * mission radius reaches `dwellMs`, AND the user is inside on the current check.
 *
 * Entry timestamps are persisted to localStorage, so the countdown survives the
 * app being backgrounded, the screen turning off, a refresh, or being reopened:
 * elapsed time is measured from first entry, not from how long the page stayed
 * open. (True background completion while the app is fully closed is not possible
 * on the web — it finalizes the next time the app is foregrounded and the user is
 * still inside.) Leaving the radius while the app is open resets that timer.
 *
 * Returns 0–1 dwell progress per mission for UI rings.
 */
export function useMissionDwell({
  missions,
  distances,
  completedIds,
  dwellMs = MISSION_DWELL_MS,
  storageNamespace,
  onComplete,
  onEnterRadius,
}: UseMissionDwellArgs) {
  const enteredAtRef = useRef<EnteredMap>({});
  const firedRef = useRef<Set<string>>(new Set());
  const hydratedRef = useRef(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);

  // Restore persisted entry timestamps once the namespace (user) is known.
  useEffect(() => {
    if (!storageNamespace) return;
    enteredAtRef.current = loadEntered(storageNamespace);
    hydratedRef.current = true;
    setTick((t) => t + 1);
  }, [storageNamespace]);

  // Re-evaluate every 5s even if geolocation hasn't refreshed.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  // Re-evaluate immediately when the app returns to the foreground.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onEnterRadiusRef = useRef(onEnterRadius);
  useEffect(() => {
    onEnterRadiusRef.current = onEnterRadius;
  }, [onEnterRadius]);

  useEffect(() => {
    const now = Date.now();
    const next: Record<string, number> = {};
    let mutated = false;

    for (const mission of missions) {
      if (completedIds.has(mission.id) || firedRef.current.has(mission.id)) {
        if (enteredAtRef.current[mission.id] !== undefined) {
          delete enteredAtRef.current[mission.id];
          mutated = true;
        }
        next[mission.id] = completedIds.has(mission.id) ? 1 : 0;
        continue;
      }

      const distance = distances[mission.id];
      const radius = mission.radius_meters ?? 50;
      const inside = distance !== undefined && distance <= radius;

      if (inside) {
        if (!enteredAtRef.current[mission.id]) {
          enteredAtRef.current[mission.id] = now;
          mutated = true;
          if (hydratedRef.current) {
            onEnterRadiusRef.current?.(mission.id);
          }
        }
        const elapsed = now - enteredAtRef.current[mission.id];
        next[mission.id] = Math.min(1, elapsed / dwellMs);

        if (elapsed >= dwellMs) {
          firedRef.current.add(mission.id);
          delete enteredAtRef.current[mission.id];
          mutated = true;
          onCompleteRef.current(mission.id);
        }
      } else {
        // Only reset when we can actually observe the user is outside.
        if (distance !== undefined && enteredAtRef.current[mission.id] !== undefined) {
          delete enteredAtRef.current[mission.id];
          mutated = true;
        }
        next[mission.id] = enteredAtRef.current[mission.id]
          ? Math.min(1, (now - enteredAtRef.current[mission.id]) / dwellMs)
          : 0;
      }
    }

    if (mutated && hydratedRef.current) {
      persistEntered(storageNamespace, enteredAtRef.current);
    }
    setProgress(next);
  }, [distances, missions, completedIds, dwellMs, storageNamespace, tick]);

  /** Reset a mission's fired guard + entry timestamp (e.g. after a failed sync). */
  const resetFired = useCallback(
    (missionId: string) => {
      firedRef.current.delete(missionId);
      delete enteredAtRef.current[missionId];
      persistEntered(storageNamespace, enteredAtRef.current);
    },
    [storageNamespace]
  );

  return { progress, resetFired };
}
