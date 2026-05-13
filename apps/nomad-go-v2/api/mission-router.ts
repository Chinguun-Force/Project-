import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { missions, missionQuests, questPool } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const missionRouter = createRouter({
  // List all active missions
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(missions).where(eq(missions.isActive, true));
  }),

  // Get mission by ID with associated quests
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const missionResults = await db
        .select()
        .from(missions)
        .where(eq(missions.id, input.id));
      const mission = missionResults[0];
      if (!mission) return null;

      // Get associated quests
      const questLinks = await db
        .select()
        .from(missionQuests)
        .where(eq(missionQuests.missionId, input.id));

      const questIds = questLinks.map((link) => link.questId);
      const quests =
        questIds.length > 0
          ? await db
              .select()
              .from(questPool)
              .where(eq(questPool.isActive, true))
          : [];

      // Filter to only linked quests
      const linkedQuests = quests.filter((q) => questIds.includes(q.id));

      return { ...mission, quests: linkedQuests };
    }),

  // Create a mission (admin/moderator)
  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radius: z.number().min(10).max(10000).default(500),
        imageUrl: z.string().optional(),
        region: z.string().max(100).optional(),
        questIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { questIds, ...missionData } = input;

      const result = await db.insert(missions).values(missionData);
      const missionId = Number(result[0].insertId);

      // Link quests if provided
      if (questIds && questIds.length > 0) {
        for (const questId of questIds) {
          await db.insert(missionQuests).values({ missionId, questId });
        }
      }

      return { id: missionId };
    }),

  // Update a mission
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        radius: z.number().min(10).max(10000).optional(),
        imageUrl: z.string().optional(),
        region: z.string().max(100).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(missions).set(data).where(eq(missions.id, id));
      return { success: true };
    }),

  // Link quest to mission
  linkQuest: authedQuery
    .input(
      z.object({
        missionId: z.number(),
        questId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Check if link already exists
      const existing = await db
        .select()
        .from(missionQuests)
        .where(
          and(
            eq(missionQuests.missionId, input.missionId),
            eq(missionQuests.questId, input.questId)
          )
        );
      if (existing.length > 0) return { success: true, message: "Already linked" };

      await db.insert(missionQuests).values(input);
      return { success: true };
    }),

  // Unlink quest from mission
  unlinkQuest: authedQuery
    .input(
      z.object({
        missionId: z.number(),
        questId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(missionQuests)
        .where(
          and(
            eq(missionQuests.missionId, input.missionId),
            eq(missionQuests.questId, input.questId)
          )
        );
      return { success: true };
    }),

  // Get missions near a location
  nearLocation: publicQuery
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusKm: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const allMissions = await db
        .select()
        .from(missions)
        .where(eq(missions.isActive, true));

      // Simple haversine distance filter
      const nearby = allMissions.filter((m) => {
        const dLat = ((m.latitude - input.latitude) * Math.PI) / 180;
        const dLon = ((m.longitude - input.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((input.latitude * Math.PI) / 180) *
            Math.cos((m.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c; // Earth radius in km
        return distance <= input.radiusKm;
      });

      return nearby;
    }),
});
