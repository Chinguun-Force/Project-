import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { userProgress, questCompletions, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

// Rank tiers
function getRankForLevel(level: number): string {
  if (level >= 50) return "Great Khan";
  if (level >= 40) return "Khan";
  if (level >= 30) return "Warlord";
  if (level >= 20) return "Steppe Warrior";
  if (level >= 10) return "Rider";
  if (level >= 5) return "Scout";
  return "Nomad";
}

function getMultiplierForLevel(level: number): number {
  return parseFloat((1 + level * 0.05).toFixed(2));
}

function xpRequiredForLevel(level: number): number {
  return Math.round(300 * Math.pow(1.2, level - 1));
}

export const progressRouter = createRouter({
  // Get current user's progress
  me: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const progresses = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, ctx.user.id));

    if (progresses.length === 0) {
      // Initialize progress for new user
      await db.insert(userProgress).values({
        userId: ctx.user.id,
        totalXp: 0,
        currentLevel: 1,
        currentRank: "Nomad",
        pointsBalance: 0,
        xpToNextLevel: 300,
        multiplier: 1.0,
        questsCompleted: 0,
        missionsCompleted: 0,
        streakDays: 0,
      });

      return {
        userId: ctx.user.id,
        totalXp: 0,
        currentLevel: 1,
        currentRank: "Nomad",
        pointsBalance: 0,
        xpToNextLevel: 300,
        multiplier: 1.0,
        questsCompleted: 0,
        missionsCompleted: 0,
        streakDays: 0,
        xpPercentage: 0,
        pointsPercentage: 0,
      };
    }

    const progress = progresses[0];
    const xpPercentage = Math.min(
      100,
      Math.round((progress.totalXp / progress.xpToNextLevel) * 100)
    );

    // Points max for display (arbitrary cap for visual)
    const pointsMax = 1000;
    const pointsPercentage = Math.min(
      100,
      Math.round((progress.pointsBalance / pointsMax) * 100)
    );

    return {
      ...progress,
      xpPercentage,
      pointsPercentage,
    };
  }),

  // Get user's quest completion history
  history: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(questCompletions)
      .where(eq(questCompletions.userId, ctx.user.id))
      .orderBy(desc(questCompletions.completedAt));
  }),

  // Get leaderboard (top users by XP)
  leaderboard: publicQuery.query(async () => {
    const db = getDb();
    const topUsers = await db
      .select()
      .from(userProgress)
      .orderBy(desc(userProgress.currentLevel))
      .limit(20);

    // Enrich with user names
    const enriched = await Promise.all(
      topUsers.map(async (progress) => {
        const userResults = await db
          .select()
          .from(users)
          .where(eq(users.id, progress.userId));
        const user = userResults[0];
        return {
          ...progress,
          userName: user?.name ?? "Anonymous",
          userAvatar: user?.avatar ?? null,
        };
      })
    );

    return enriched;
  }),

  // Simulate daily login streak
  dailyLogin: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const progresses = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, ctx.user.id));

    if (progresses.length === 0) {
      await db.insert(userProgress).values({
        userId: ctx.user.id,
        totalXp: 10,
        currentLevel: 1,
        currentRank: "Nomad",
        pointsBalance: 5,
        xpToNextLevel: 300,
        multiplier: 1.0,
        questsCompleted: 0,
        missionsCompleted: 0,
        streakDays: 1,
      });
      return { xpGained: 10, pointsGained: 5, streakDays: 1 };
    }

    const progress = progresses[0];
    const streakDays = progress.streakDays + 1;
    // Bonus for streaks
    const bonusMultiplier = Math.min(3, 1 + streakDays * 0.1);
    const xpGained = Math.round(10 * bonusMultiplier);
    const pointsGained = Math.round(5 * bonusMultiplier);

    let newTotalXp = progress.totalXp + xpGained;
    let newLevel = progress.currentLevel;
    let newRank = progress.currentRank;
    let newMultiplier = progress.multiplier;
    let newXpToNext = progress.xpToNextLevel;
    let levelsGained = 0;

    while (newTotalXp >= newXpToNext) {
      newTotalXp -= newXpToNext;
      newLevel++;
      levelsGained++;
      newRank = getRankForLevel(newLevel);
      newMultiplier = getMultiplierForLevel(newLevel);
      newXpToNext = xpRequiredForLevel(newLevel);
    }

    await db
      .update(userProgress)
      .set({
        totalXp: newTotalXp,
        currentLevel: newLevel,
        currentRank: newRank,
        pointsBalance: progress.pointsBalance + pointsGained,
        xpToNextLevel: newXpToNext,
        multiplier: newMultiplier,
        streakDays,
      })
      .where(eq(userProgress.userId, ctx.user.id));

    return {
      xpGained,
      pointsGained,
      streakDays,
      levelsGained,
      newLevel,
      newRank,
      newMultiplier,
    };
  }),

  // Seed initial progress for testing (admin)
  seed: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    // Check if progress exists
    const existing = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, ctx.user.id));

    if (existing.length > 0) {
      // Give some starting XP
      await db
        .update(userProgress)
        .set({
          totalXp: 150,
          pointsBalance: 200,
        })
        .where(eq(userProgress.userId, ctx.user.id));
    } else {
      await db.insert(userProgress).values({
        userId: ctx.user.id,
        totalXp: 150,
        currentLevel: 1,
        currentRank: "Nomad",
        pointsBalance: 200,
        xpToNextLevel: 300,
        multiplier: 1.0,
        questsCompleted: 0,
        missionsCompleted: 0,
        streakDays: 0,
      });
    }

    return { success: true };
  }),
});
