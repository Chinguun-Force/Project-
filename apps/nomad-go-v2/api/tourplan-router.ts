import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  tourPlans,
  tourPlanMissions,
  missions,
  questPool,
  missionQuests,
} from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const tourPlanRouter = createRouter({
  // List all published tour plans
  listPublished: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(tourPlans)
      .where(eq(tourPlans.isPublished, true))
      .orderBy(desc(tourPlans.createdAt));
  }),

  // List all tour plans for a moderator
  listByOperator: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(tourPlans)
      .where(eq(tourPlans.operatorId, ctx.user.id))
      .orderBy(desc(tourPlans.createdAt));
  }),

  // Get tour plan by ID with mission sequence
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const plans = await db
        .select()
        .from(tourPlans)
        .where(eq(tourPlans.id, input.id));
      const plan = plans[0];
      if (!plan) return null;

      // Get mission sequence
      const sequence = await db
        .select()
        .from(tourPlanMissions)
        .where(eq(tourPlanMissions.tourPlanId, input.id))
        .orderBy(tourPlanMissions.sequenceOrder);

      // Fetch mission details
      const missionsWithQuests = await Promise.all(
        sequence.map(async (seq) => {
          const missionResults = await db
            .select()
            .from(missions)
            .where(eq(missions.id, seq.missionId));
          const mission = missionResults[0];
          if (!mission) return null;

          // Get quests for this mission
          const questLinks = await db
            .select()
            .from(missionQuests)
            .where(eq(missionQuests.missionId, seq.missionId));

          const questIds = questLinks.map((link) => link.questId);
          const quests =
            questIds.length > 0
              ? await db
                  .select()
                  .from(questPool)
                  .where(eq(questPool.isActive, true))
              : [];

          return {
            ...mission,
            sequenceOrder: seq.sequenceOrder,
            quests: quests.filter((q) => questIds.includes(q.id)),
          };
        })
      );

      return {
        ...plan,
        missions: missionsWithQuests.filter(Boolean),
      };
    }),

  // Create a tour plan (moderator)
  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        estimatedDuration: z.number().min(1).max(72).default(1),
        missionIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { missionIds, ...planData } = input;

      // Calculate total XP from missions' quests
      let totalXp = 0;
      if (missionIds && missionIds.length > 0) {
        for (const mId of missionIds) {
          const questLinks = await db
            .select()
            .from(missionQuests)
            .where(eq(missionQuests.missionId, mId));
          for (const link of questLinks) {
            const quests = await db
              .select()
              .from(questPool)
              .where(eq(questPool.id, link.questId));
            if (quests[0]) totalXp += quests[0].baseXp;
          }
        }
      }

      const result = await db.insert(tourPlans).values({
        ...planData,
        operatorId: ctx.user.id,
        totalXp,
      });
      const tourPlanId = Number(result[0].insertId);

      // Add mission sequence
      if (missionIds && missionIds.length > 0) {
        for (let i = 0; i < missionIds.length; i++) {
          await db.insert(tourPlanMissions).values({
            tourPlanId,
            missionId: missionIds[i],
            sequenceOrder: i,
          });
        }
      }

      return { id: tourPlanId };
    }),

  // Publish a tour plan
  publish: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(tourPlans)
        .set({ isPublished: true })
        .where(eq(tourPlans.id, input.id));
      return { success: true };
    }),

  // Delete a tour plan
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Delete mission links first
      await db
        .delete(tourPlanMissions)
        .where(eq(tourPlanMissions.tourPlanId, input.id));
      // Delete tour plan
      await db.delete(tourPlans).where(eq(tourPlans.id, input.id));
      return { success: true };
    }),
});
