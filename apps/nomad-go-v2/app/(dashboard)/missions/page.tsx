"use client";
import { useEffect, useState } from "react";
import { getMissionsAction } from "@/app/actions/gameActions";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Skeleton } from "@/components/ui/skeleton";

export default function MissionsModule() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

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
      <h1 className="text-2xl font-bold text-emerald-400 mb-6 shadow-sm">
        Sightseeing Bucket List
      </h1>

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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
