import { authRouter } from "./auth-router";
import { questRouter } from "./quest-router";
import { missionRouter } from "./mission-router";
import { tourPlanRouter } from "./tourplan-router";
import { progressRouter } from "./progress-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  quest: questRouter,
  mission: missionRouter,
  tourPlan: tourPlanRouter,
  progress: progressRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
