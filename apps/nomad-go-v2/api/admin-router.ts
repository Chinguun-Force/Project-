import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, questPool, missions, tourPlans } from "@db/schema";
import { eq, desc, count } from "drizzle-orm";

export const adminRouter = createRouter({
  // List all users (admin only)
  listUsers: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }),

  // Update user role (admin only)
  updateUserRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "moderator", "guide", "tourist"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Get platform stats
  stats: adminQuery.query(async () => {
    const db = getDb();
    const totalUsers = await db
      .select({ count: count() })
      .from(users);
    const totalQuests = await db
      .select({ count: count() })
      .from(questPool);
    const totalMissions = await db
      .select({ count: count() })
      .from(missions);
    const totalTourPlans = await db
      .select({ count: count() })
      .from(tourPlans);

    return {
      totalUsers: totalUsers[0]?.count ?? 0,
      totalQuests: totalQuests[0]?.count ?? 0,
      totalMissions: totalMissions[0]?.count ?? 0,
      totalTourPlans: totalTourPlans[0]?.count ?? 0,
    };
  }),

  // Approve a quest (admin validation)
  approveQuest: adminQuery
    .input(
      z.object({
        questId: z.number(),
        approved: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(questPool)
        .set({ isActive: input.approved })
        .where(eq(questPool.id, input.questId));
      return { success: true };
    }),

  // Get pending tour plans for validation
  pendingTourPlans: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(tourPlans)
      .where(eq(tourPlans.isPublished, false))
      .orderBy(desc(tourPlans.createdAt));
  }),

  // Validate a tour plan (admin approval)
  validateTourPlan: adminQuery
    .input(
      z.object({
        tourPlanId: z.number(),
        approved: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(tourPlans)
        .set({ isPublished: input.approved })
        .where(eq(tourPlans.id, input.tourPlanId));
      return { success: true };
    }),
});
