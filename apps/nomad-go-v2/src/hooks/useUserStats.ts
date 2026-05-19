import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
      setUserStats(data as unknown as User);
    }
    setIsLoading(false);
  }, [authUser?.id, supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const addXp = async (amount: number) => {
    if (!userStats || !authUser?.id) return null;

    let newXp = (userStats.currentXp ?? 0) + amount;
    let newLevel = userStats.level ?? 1;
    let newThreshold = userStats.xpThreshold ?? 1000;
    const newTotalXp = (userStats.totalXp ?? 0) + amount;
    let levelsGained = 0;

    while (newXp >= newThreshold) {
      newXp -= newThreshold;
      newLevel += 1;
      levelsGained += 1;
      newThreshold = Math.floor(newThreshold * 1.5);
    }

    const updates = {
      current_xp: newXp,
      level: newLevel,
      xp_threshold: newThreshold,
      total_xp: newTotalXp,
    };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", authUser.id);

    if (!error) {
      setUserStats((prev) => prev ? { ...prev, currentXp: newXp, level: newLevel, xpThreshold: newThreshold, totalXp: newTotalXp } : prev);
      return { levelsGained, newLevel };
    }
    return null;
  };

  const addPoints = async (amount: number) => {
    if (!userStats || !authUser?.id) return false;

    const newPoints = (userStats.points ?? 0) + amount;
    const { error } = await supabase
      .from("users")
      .update({ points: newPoints })
      .eq("id", authUser.id);

    if (!error) {
      setUserStats((prev) => prev ? { ...prev, points: newPoints } : prev);
      return true;
    }
    return false;
  };

  const completeQuest = async (questId: string, pointsEarned: number, responseData?: any) => {
    if (!userStats || !authUser?.id) return false;

    const { error } = await supabase.from('user_quests').insert({
      user_id: authUser.id,
      quest_id: questId,
      status: 'completed',
    });

    if (responseData) {
      await supabase.from('quest_responses').insert({
        user_id: authUser.id,
        quest_id: questId,
        status: 'completed',
        response_data: responseData,
      });
    }

    if (!error) {
      return await addPoints(pointsEarned);
    }
    return false;
  };

  const completeMission = async (stepId: string, xpEarned: number) => {
    if (!userStats || !authUser?.id) return null;
    
    // Note: If you have a user_missions or user_journey_steps table in the future,
    // insert completion record here.
    
    return await addXp(xpEarned);
  };

  return {
    userStats,
    isLoading,
    addXp,
    addPoints,
    completeQuest,
    completeMission,
    refreshStats: fetchStats,
  };
}
