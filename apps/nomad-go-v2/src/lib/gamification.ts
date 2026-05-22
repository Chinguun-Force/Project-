/** Default XP when `quests.xp_reward` column is absent (Supabase schema). */
export const DEFAULT_QUEST_XP_REWARD = 3;

/** English rank phonetics mapped to player level (do not rename). */
export function getMongolianRank(level: number): string {
  if (level >= 46) return "Khan";
  if (level >= 37) return "Noyon";
  if (level >= 29) return "Suldtei";
  if (level >= 22) return "Talyn Khun";
  if (level >= 16) return "Zam Medegch";
  if (level >= 11) return "Nuudelchin";
  if (level >= 7) return "Aduuchin";
  if (level >= 4) return "Zamchin";
  return "Otgon";
}

/** XP is static; Shagai points scale 5% per level (matches grantUserRewardsAction). */
export function computeOptimisticRewards(
  baseXp: number,
  basePoints: number,
  currentLevel: number
) {
  const finalXpReward = baseXp;
  const finalPointReward = Math.floor(basePoints * (1 + currentLevel * 0.05));
  return { finalXpReward, finalPointReward };
}

export function levelPointMultiplier(level: number): number {
  return 1 + level * 0.05;
}
