"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getMissionsAction,
  getToursForMissionAction,
  getCompletedMissionIdsAction,
  completeMissionAction,
  notifyMissionRadiusEnteredAction,
  notifyQuestsIntroAction,
} from "@/app/actions/gameActions";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMissionDwell, MISSION_DWELL_MS } from "@/hooks/useMissionDwell";
import { formatDistanceKm } from "@/lib/quest/haversine";
import { useUserStats } from "@/hooks/useUserStats";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Route, Timer } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import FloatingGains from "@/components/FloatingGains";

type TourSuggestion = {
  tripTemplates: {
    type: "trip";
    id: string;
    name: string;
    description?: string | null;
    companyName?: string | null;
  }[];
};

export default function MissionsModule() {
  const { userStats, refreshStats } = useUserStats();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toursByMission, setToursByMission] = useState<Record<string, TourSuggestion>>({});
  const [loadingToursId, setLoadingToursId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [floatingXp, setFloatingXp] = useState<number | null>(null);

  const incompleteMissions = useMemo(
    () => missions.filter((m) => !completedIds.has(m.id)),
    [missions, completedIds],
  );

  const missionLocations = useMemo(
    () =>
      incompleteMissions.map((m) => ({
        id: m.id,
        latitude: m.latitude,
        longitude: m.longitude,
        radiusMeters: m.radius_meters ?? 50,
      })),
    [incompleteMissions],
  );

  const { distances } = useGeolocation(missionLocations);

  useEffect(() => {
    async function loadMissions() {
      try {
        setLoading(true);
        const data = await getMissionsAction();
        setMissions(data || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setApiError(message);
      } finally {
        setLoading(false);
      }
    }
    loadMissions();
  }, []);

  useEffect(() => {
    if (!userStats?.id) return;
    getCompletedMissionIdsAction(userStats.id)
      .then((ids) => setCompletedIds(new Set(ids)))
      .catch(() => setCompletedIds(new Set()));
  }, [userStats?.id]);

  const handleMissionComplete = useCallback(
    async (missionId: string) => {
      const userId = userStats?.id;
      if (!userId) return;

      const mission = missions.find((m) => m.id === missionId);
      const xpReward = Number(mission?.xp_reward ?? 0);

      // Optimistic: hide immediately + dopamine feedback.
      setCompletedIds((prev) => new Set(prev).add(missionId));
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      if (xpReward > 0) {
        setFloatingXp(xpReward);
        setTimeout(() => setFloatingXp(null), 2500);
      }
      toast.success(
        `Mission complete! ${xpReward > 0 ? `+${xpReward} XP` : ""}`.trim()
      );

      try {
        const result = await completeMissionAction(userId, missionId);
        if (result.success || result.alreadyCompleted) {
          await refreshStats();
        } else {
          toast.error(result.error ?? "Could not sync mission completion.");
        }
      } catch {
        toast.info("Mission saved — XP will sync when you're back online.");
      }
    },
    [userStats?.id, missions, refreshStats]
  );

  const handleMissionEnter = useCallback(
    async (missionId: string) => {
      const userId = userStats?.id;
      if (!userId) return;

      try {
        await notifyMissionRadiusEnteredAction(userId, missionId);

        const introKey = `nomad:quests-intro-push:${userId}`;
        if (typeof window !== "undefined" && !window.localStorage.getItem(introKey)) {
          window.localStorage.setItem(introKey, "1");
          await notifyQuestsIntroAction(userId);
        }
      } catch {
        // Best-effort push; dwell timer still runs in-app.
      }
    },
    [userStats?.id],
  );

  const { progress } = useMissionDwell({
    missions: incompleteMissions,
    distances,
    completedIds,
    storageNamespace: userStats?.id,
    onComplete: handleMissionComplete,
    onEnterRadius: handleMissionEnter,
  });

  const toggleTours = async (missionId: string) => {
    if (expandedId === missionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(missionId);
    if (toursByMission[missionId]) return;

    setLoadingToursId(missionId);
    try {
      const data = await getToursForMissionAction(missionId);
      setToursByMission((prev) => ({ ...prev, [missionId]: data }));
    } catch {
      setToursByMission((prev) => ({
        ...prev,
        [missionId]: { tripTemplates: [] },
      }));
    } finally {
      setLoadingToursId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-[#1A1D26] min-h-screen">
        <Skeleton className="h-8 w-64 mb-6 bg-[#322F36]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-[#322F36]" />
          ))}
        </div>
      </div>
    );
  }

  if (apiError) {
    return <div className="p-8 text-red-500">API Error: {apiError}</div>;
  }

  const dwellMinutes = Math.round(MISSION_DWELL_MS / 60000);

  return (
    <div className="p-6 bg-[#1A1D26] min-h-screen text-white">
      {floatingXp !== null && (
        <FloatingGains
          xpGained={floatingXp}
          pointsGained={0}
        />
      )}
      <h1 className="text-2xl font-bold text-emerald-400 mb-2 shadow-sm">
        Sightseeing Bucket List
      </h1>
      <p className="text-sm text-[#A0A0B0] mb-6">
        Stay within a sight&apos;s radius for {dwellMinutes} minutes to auto-complete it and earn XP.
        Completed sights disappear from this list.
      </p>

      {incompleteMissions.length === 0 ? (
        <div className="border border-dashed border-zinc-700 p-8 text-center rounded-xl text-zinc-500">
          {missions.length === 0
            ? "No missions found in database."
            : "All sights completed — great exploring! 🎉"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incompleteMissions.map((mission) => {
            const distance = distances[mission.id];
            const isInside =
              distance !== undefined && distance <= (mission.radius_meters || 50);
            const isExpanded = expandedId === mission.id;
            const tours = toursByMission[mission.id];
            const totalTours = tours?.tripTemplates.length ?? 0;
            const dwellPct = Math.round((progress[mission.id] ?? 0) * 100);
            const dwellSecondsLeft = Math.max(
              0,
              Math.ceil(((1 - (progress[mission.id] ?? 0)) * MISSION_DWELL_MS) / 1000)
            );

            return (
              <div
                key={mission.id}
                className="overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-all"
              >
                {mission.image_url ? (
                  <img
                    src={mission.image_url}
                    alt={mission.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-zinc-800/50 flex items-center justify-center text-zinc-500 text-sm">
                    No image
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-200">{mission.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{mission.description}</p>
                  <div className="mt-4 flex justify-between items-center text-xs">
                    {(mission.xp_reward ?? 0) > 0 ? (
                      <span className="text-zinc-500">+{mission.xp_reward} XP</span>
                    ) : (
                      <span />
                    )}
                    <span
                      className={`font-mono ${isInside ? "text-emerald-400" : "text-zinc-400"}`}
                    >
                      {distance !== undefined
                        ? `${formatDistanceKm(distance)} away`
                        : "Calculating distance..."}
                    </span>
                  </div>

                  {isInside && (
                    <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Timer className="w-3.5 h-3.5" />
                          Checking in… stay nearby
                        </span>
                        <span className="font-mono text-emerald-300">
                          {Math.floor(dwellSecondsLeft / 60)}:
                          {String(dwellSecondsLeft % 60).padStart(2, "0")} left
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-500 ease-out"
                          style={{ width: `${dwellPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleTours(mission.id)}
                    className="mt-4 w-full flex items-center justify-between text-sm text-emerald-400/90 hover:text-emerald-400 border border-zinc-700 rounded-lg px-3 py-2"
                  >
                    <span className="flex items-center gap-2">
                      <Route className="w-4 h-4" />
                      Tours including this sight
                      {tours && totalTours > 0 && (
                        <span className="text-zinc-500">({totalTours})</span>
                      )}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                      {loadingToursId === mission.id ? (
                        <div className="flex justify-center py-4">
                          <Spinner className="w-5 h-5 text-emerald-400" />
                        </div>
                      ) : totalTours === 0 ? (
                        <p className="text-xs text-zinc-500">
                          No tours linked yet. Moderator can attach this sight to a trip template.
                        </p>
                      ) : (
                        <>
                          {tours?.tripTemplates.map((t) => (
                            <Link
                              key={t.id}
                              href={`/tours/${t.id}`}
                              className="block rounded-lg bg-zinc-800/50 px-3 py-2 text-sm hover:bg-zinc-800 transition-colors"
                            >
                              <p className="text-zinc-200 font-medium">{t.name}</p>
                              {t.companyName && (
                                <p className="text-xs text-zinc-500">{t.companyName}</p>
                              )}
                              <span className="text-[10px] uppercase text-[#F4C64D] tracking-wide">
                                Trip template →
                              </span>
                            </Link>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
