"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMissionsAction, getToursForMissionAction } from "@/app/actions/gameActions";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, MapPin, Route } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toursByMission, setToursByMission] = useState<Record<string, TourSuggestion>>({});
  const [loadingToursId, setLoadingToursId] = useState<string | null>(null);

  const { distances } = useGeolocation(missions);

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

  return (
    <div className="p-6 bg-[#1A1D26] min-h-screen text-white">
      <h1 className="text-2xl font-bold text-emerald-400 mb-2 shadow-sm">
        Sightseeing Bucket List
      </h1>
      <p className="text-sm text-[#A0A0B0] mb-6">
        Visit sights within radius to earn XP. Expand a sight to see tours that include it.
      </p>

      {missions.length === 0 ? (
        <div className="border border-dashed border-zinc-700 p-8 text-center rounded-xl text-zinc-500">
          No missions found in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((mission) => {
            const distance = distances[mission.id];
            const isInside =
              distance !== undefined && distance <= (mission.radius_meters || 50);
            const isExpanded = expandedId === mission.id;
            const tours = toursByMission[mission.id];
            const totalTours = tours?.tripTemplates.length ?? 0;

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
                    <span className="text-zinc-500">
                      Radius: {mission.radius_meters}m
                      {(mission.xp_reward ?? 0) > 0 && ` · +${mission.xp_reward} XP`}
                    </span>
                    <span
                      className={`font-mono ${isInside ? "text-emerald-400" : "text-zinc-400"}`}
                    >
                      {distance !== undefined
                        ? `${distance.toFixed(0)}m away`
                        : "Calculating distance..."}
                    </span>
                  </div>

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
