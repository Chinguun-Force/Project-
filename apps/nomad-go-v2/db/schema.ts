import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  doublePrecision,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";

// ========================
// USERS (Extended for 4-tier role system)
// ========================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: pgEnum("role", ["admin", "moderator", "guide", "tourist"])
    .default("tourist")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ========================
// QUEST POOL (Global quest templates)
// ========================
export const questPool = pgTable("quest_pool", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  baseXp: integer("base_xp").default(100).notNull(),
  basePoints: integer("base_points").default(50).notNull(),
  logicType: pgEnum("logic_type", ["photo", "gps", "quiz", "manual"])
    .default("manual")
    .notNull(),
  category: pgEnum("category", ["daily", "location_specific", "global"])
    .default("global")
    .notNull(),
  imageUrl: text("image_url"),
  requirements: jsonb("requirements").$type<Record<string, unknown>>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Quest = typeof questPool.$inferSelect;
export type InsertQuest = typeof questPool.$inferInsert;

// ========================
// MISSIONS (Destinations / GPS locations)
// ========================
export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radius: integer("radius").default(500).notNull(), // GPS fence radius in meters
  imageUrl: text("image_url"),
  region: varchar("region", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Mission = typeof missions.$inferSelect;
export type InsertMission = typeof missions.$inferInsert;

// ========================
// MISSION QUEST LINKS (Many-to-many: missions <-> quest_pool)
// ========================
export const missionQuests = pgTable("mission_quests", {
  id: serial("id").primaryKey(),
  missionId: bigint("mission_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => missions.id),
  questId: bigint("quest_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => questPool.id),
});

// ========================
// TOUR PLANS (Moderator-created itineraries)
// ========================
export const tourPlans = pgTable("tour_plans", {
  id: serial("id").primaryKey(),
  operatorId: bigint("operator_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  difficulty: pgEnum("difficulty", ["easy", "medium", "hard"])
    .default("medium")
    .notNull(),
  estimatedDuration: integer("estimated_duration").default(1), // hours
  totalXp: integer("total_xp").default(0).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TourPlan = typeof tourPlans.$inferSelect;
export type InsertTourPlan = typeof tourPlans.$inferInsert;

// ========================
// TOUR PLAN MISSION SEQUENCE
// ========================
export const tourPlanMissions = pgTable("tour_plan_missions", {
  id: serial("id").primaryKey(),
  tourPlanId: bigint("tour_plan_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => tourPlans.id),
  missionId: bigint("mission_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => missions.id),
  sequenceOrder: integer("sequence_order").default(0).notNull(),
});

// ========================
// USER PROGRESS (XP, Points, Level, Rank)
// ========================
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id)
    .unique(),
  totalXp: integer("total_xp").default(0).notNull(),
  currentLevel: integer("current_level").default(1).notNull(),
  currentRank: varchar("current_rank", { length: 50 })
    .default("Nomad")
    .notNull(),
  pointsBalance: integer("points_balance").default(0).notNull(),
  xpToNextLevel: integer("xp_to_next_level").default(300).notNull(),
  multiplier: doublePrecision("multiplier").default(1.0).notNull(),
  questsCompleted: integer("quests_completed").default(0).notNull(),
  missionsCompleted: integer("missions_completed").default(0).notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

// ========================
// QUEST COMPLETIONS (Log of completed quests)
// ========================
export const questCompletions = pgTable("quest_completions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  questId: bigint("quest_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => questPool.id),
  missionId: bigint("mission_id", { mode: "number", unsigned: true }).references(
    () => missions.id
  ),
  xpEarned: integer("xp_earned").default(0).notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  completionData: jsonb("completion_data").$type<Record<string, unknown>>(),
  validatedBy: bigint("validated_by", { mode: "number", unsigned: true }).references(
    () => users.id
  ), // Guide who validated
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export type QuestCompletion = typeof questCompletions.$inferSelect;

// ========================
// USER TOUR PLAN ENROLLMENTS
// ========================
export const userTourEnrollments = pgTable("user_tour_enrollments", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  tourPlanId: bigint("tour_plan_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => tourPlans.id),
  status: pgEnum("status", ["active", "completed", "abandoned"])
    .default("active")
    .notNull(),
  progress: integer("progress").default(0).notNull(), // percentage
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
