import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { questPool, questCompletions, userProgress } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

// XP Formula: Final_XP = Base_XP * (1 + (Current_Level * 0.05))
function calculateFinalXp(baseXp: number, currentLevel: number): number {
  return Math.round(baseXp * (1 + currentLevel * 0.05));
}

// Rank tiers based on level
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
  // Exponential XP curve: 300 * (1.2 ^ (level - 1))
  return Math.round(300 * Math.pow(1.2, level - 1));
}

export const questRouter = createRouter({
  // List all active quests
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(questPool).where(eq(questPool.isActive, true));
  }),

  // Get a single quest by ID
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(questPool)
        .where(eq(questPool.id, input.id));
      return results[0] ?? null;
    }),

  // Create a quest (admin/moderator only)
  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        baseXp: z.number().min(10).max(10000).default(100),
        basePoints: z.number().min(5).max(5000).default(50),
        logicType: z.enum(["photo", "gps", "quiz", "manual"]).default("manual"),
        category: z.enum(["daily", "location_specific", "global"]).default("global"),
        imageUrl: z.string().optional(),
        requirements: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(questPool).values({
        ...input,
        requirements: input.requirements ?? null,
      });
      return { id: Number(result[0].insertId) };
    }),

  // Update a quest
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        baseXp: z.number().min(10).max(10000).optional(),
        basePoints: z.number().min(5).max(5000).optional(),
        logicType: z.enum(["photo", "gps", "quiz", "manual"]).optional(),
        category: z.enum(["daily", "location_specific", "global"]).optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(questPool).set(data).where(eq(questPool.id, id));
      return { success: true };
    }),

  // Delete (deactivate) a quest
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(questPool)
        .set({ isActive: false })
        .where(eq(questPool.id, input.id));
      return { success: true };
    }),

  // Complete a quest (earn XP and points)
  complete: authedQuery
    .input(
      z.object({
        questId: z.number(),
        missionId: z.number().optional(),
        completionData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Get the quest details
      const quests = await db
        .select()
        .from(questPool)
        .where(eq(questPool.id, input.questId));
      const quest = quests[0];
      if (!quest) throw new Error("Quest not found");

      // Get user progress
      const progresses = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
      let progress = progresses[0];

      if (!progress) {
        // Create initial progress
        await db.insert(userProgress).values({
          userId,
          totalXp: 0,
          currentLevel: 1,
          currentRank: "Nomad",
          pointsBalance: 0,
          xpToNextLevel: 300,
          multiplier: 1.0,
          questsCompleted: 0,
          missionsCompleted: 0,
        });
        const newProgresses = await db
          .select()
          .from(userProgress)
          .where(eq(userProgress.userId, userId));
        progress = newProgresses[0];
      }

      // Calculate final XP with multiplier
      const finalXp = calculateFinalXp(quest.baseXp, progress.currentLevel);
      const finalPoints = Math.round(quest.basePoints * progress.multiplier);

      // Check if user already completed this quest
      const existingCompletions = await db
        .select()
        .from(questCompletions)
        .where(
          and(
            eq(questCompletions.userId, userId),
            eq(questCompletions.questId, input.questId)
          )
        );

      if (existingCompletions.length > 0) {
        // Allow re-completion for daily quests
        if (quest.category !== "daily") {
          return {
            success: false,
            message: "Quest already completed",
            xpEarned: 0,
            pointsEarned: 0,
          };
        }
      }

      // Record completion
      await db.insert(questCompletions).values({
        userId,
        questId: input.questId,
        missionId: input.missionId ?? null,
        xpEarned: finalXp,
        pointsEarned: finalPoints,
        completionData: input.completionData ?? null,
      });

      // Calculate new XP total and check for level up
      let newTotalXp = progress.totalXp + finalXp;
      let newLevel = progress.currentLevel;
      let newRank = progress.currentRank;
      let newMultiplier = progress.multiplier;
      let newXpToNext = progress.xpToNextLevel;
      let levelsGained = 0;

      // Check for level ups
      while (newTotalXp >= newXpToNext) {
        newTotalXp -= newXpToNext;
        newLevel++;
        levelsGained++;
        newRank = getRankForLevel(newLevel);
        newMultiplier = getMultiplierForLevel(newLevel);
        newXpToNext = xpRequiredForLevel(newLevel);
      }

      // Update user progress
      await db
        .update(userProgress)
        .set({
          totalXp: newTotalXp,
          currentLevel: newLevel,
          currentRank: newRank,
          pointsBalance: progress.pointsBalance + finalPoints,
          xpToNextLevel: newXpToNext,
          multiplier: newMultiplier,
          questsCompleted: progress.questsCompleted + 1,
        })
        .where(eq(userProgress.userId, userId));

      return {
        success: true,
        xpEarned: finalXp,
        pointsEarned: finalPoints,
        levelsGained,
        newLevel,
        newRank,
        newMultiplier,
        currentXp: newTotalXp,
        xpToNext: newXpToNext,
      };
    }),

  // Get user's quest history
  getUserCompletions: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(questCompletions)
      .where(eq(questCompletions.userId, ctx.user.id))
      .orderBy(desc(questCompletions.completedAt));
  }),
});
