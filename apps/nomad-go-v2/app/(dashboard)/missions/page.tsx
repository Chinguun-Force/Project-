"use client";
import { useEffect, useState } from "react";
import { getMissionsAction } from "@/app/actions/gameActions";
import { useGeolocation } from "@/hooks/useGeolocation";

export default function MissionsModule() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pass missions to our geofencing hook
  const { distances, activeMissionId } = useGeolocation(missions);

  useEffect(() => {
    async function loadMissions() {
      try {
        setLoading(true);
        console.log("🔍 [DIAGNOSTIC] Calling getMissionsAction()...");
        const data = await getMissionsAction();
        
        console.log("🔥 [DIAGNOSTIC] Raw Data received from API:", data);
        
        if (!data || data.length === 0) {
          console.warn("⚠️ [DIAGNOSTIC] API returned a 200 OK, but the array is COMPLETELY EMPTY. Double check if rows actually exist under the correct tenant/schema.");
        }
        
        setMissions(data || []);
      } catch (err: any) {
        console.error("⛔ [DIAGNOSTIC] Crash during state update:", err.message);
        setApiError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadMissions();
  }, []);

  if (loading) return <div className="p-8 text-emerald-400 animate-pulse">Loading physical exploration nodes...</div>;
  if (apiError) return <div className="p-8 text-red-500">API Wire Error: {apiError}</div>;

  return (
    <div className="p-6 bg-[#1A1D26] min-h-screen text-white">
      <h1 className="text-2xl font-bold text-emerald-400 mb-6 shadow-sm">Sightseeing Bucket List</h1>
      
      {/* Fallback UI if array is truly empty */}
      {missions.length === 0 ? (
        <div className="border border-dashed border-zinc-700 p-8 text-center rounded-xl text-zinc-500">
          No missions found in db. Total array count: 0. Check schema or session constraints.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((mission) => {
            const distance = distances[mission.id];
            const isInside = distance !== undefined && distance <= (mission.radius_meters || 50);

            return (
              <div key={mission.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-all">
                <h3 className="text-lg font-semibold text-zinc-200">{mission.title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{mission.description}</p>
                <div className="mt-4 flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Radius: {mission.radius_meters}m</span>
                  <span className={`font-mono ${isInside ? "text-emerald-400" : "text-zinc-400"}`}>
                    {distance !== undefined ? `${distance.toFixed(0)}m away` : "Calculating distance..."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
