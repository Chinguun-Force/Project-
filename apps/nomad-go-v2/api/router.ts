import { authRouter } from "./auth-router";
import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";

const dummyQuery = publicQuery.query(() => null as any);
const dummyMutation = publicQuery.mutation(() => null as any);

const dummyQuest = createRouter({
  getDaily: publicQuery.query(() => [] as any[]),
  getAll: publicQuery.query(() => [] as any[]),
  list: publicQuery.query(() => [] as any[]),
  getUserCompletions: publicQuery.query(() => [] as any[]),
  complete: dummyMutation,
});

const dummyMission = createRouter({
  getAll: publicQuery.query(() => [] as any[]),
  list: publicQuery.query(() => [] as any[]),
  nearLocation: publicQuery.input(z.any()).query(() => [] as any[]),
});

const dummyTourPlan = createRouter({
  listPublished: publicQuery.query(() => [] as any[]),
});

const dummyProgress = createRouter({
  getStats: publicQuery.query(() => ({} as any)),
  syncSetting: dummyMutation,
  dailyLogin: dummyMutation,
  me: publicQuery.query(() => ({} as any)),
  leaderboard: publicQuery.query(() => [] as any[]),
  seed: dummyMutation,
});

const dummyAdmin = createRouter({
  getDashboardStats: publicQuery.query(() => ({} as any)),
  createQuest: dummyMutation,
  deleteQuest: dummyMutation,
  pendingTourPlans: publicQuery.query(() => [] as any[]),
  stats: publicQuery.query(() => ({} as any)),
  listUsers: publicQuery.query(() => [] as any[]),
  updateUserRole: publicQuery.input(z.any()).mutation(() => null as any),
  validateTourPlan: publicQuery.input(z.any()).mutation(() => null as any),
});

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  quest: dummyQuest,
  mission: dummyMission,
  tourPlan: dummyTourPlan,
  progress: dummyProgress,
  admin: dummyAdmin,
});

export type AppRouter = typeof appRouter;
