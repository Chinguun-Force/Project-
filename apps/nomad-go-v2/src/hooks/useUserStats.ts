import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { completeRoomActivityAction } from "@/app/actions/gameActions";
import { submitQuestOffline } from "@/lib/offline/submitQuest";
import type { User } from "@db/schema";

export function useUserStats() {
  const { user: authUser } = useAuth();
  const [userStats, setUserStats] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    if (!authUser?.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (!error && data) {
      const row = data as Record<string, unknown>;
      setUserStats({
        ...(data as User),
        availablePoints: Number(row.available_points ?? row.availablePoints ?? 0),
        points: Number(row.points ?? row.available_points ?? 0),
        level: Number(row.level ?? 1),
        currentXp: Number(row.current_xp ?? row.currentXp ?? 0),
        totalXp: Number(row.total_xp ?? row.totalXp ?? 0),
        xpThreshold: Number(row.xp_threshold ?? row.xpThreshold ?? 1000),
      } as User);
    }
    setIsLoading(false);
  }, [authUser?.id, supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /** Quest completion — delegates to centralized RPG rewards engine. */
  const completeQuest = async (questId: string, _pointsEarned?: number, responseData?: unknown) => {
    if (!authUser?.id) return null;

    const payload =
      responseData && typeof responseData === "object" && !Array.isArray(responseData)
        ? (responseData as Record<string, unknown>)
        : responseData != null
          ? { data: responseData }
          : {};

    const roomId =
      (authUser.user_metadata?.room_id as string | undefined) ?? null;
    const { synced, error } = await submitQuestOffline(authUser.id, questId, {
      payload,
      roomId,
    });
    if (synced) {
      await fetchStats();
      return { success: true as const };
    }
    if (!error) {
      return { success: true as const, pendingSync: true as const };
    }
    return { success: false as const, error };
  };

  /** Journey / mission step completion — XP (+ optional points) via rewards engine. */
  const completeMission = async (stepId: string) => {
    if (!authUser?.id) return null;

    const result = await completeRoomActivityAction(authUser.id, stepId);
    if (result?.success) {
      await fetchStats();
    }
    return result;
  };

  return {
    userStats,
    isLoading,
    completeQuest,
    completeMission,
    refreshStats: fetchStats,
  };
}
