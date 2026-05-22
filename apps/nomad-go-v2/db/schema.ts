import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  bigint,
  time,
  doublePrecision,
} from "drizzle-orm/pg-core";

// ========================
// USERS
// ========================
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  email: text("email"),
  level: integer("level").default(1),
  currentXp: integer("current_xp").default(0),
  xpThreshold: integer("xp_threshold").default(1000),
  totalXp: bigint("total_xp", { mode: "number" }).default(0),
  points: integer("points").default(0),
  completedQuests: integer("completed_quests").default(0),
  avatarUrl: text("avatar_url"),
  sessionId: uuid("session_id"), // References sessions.id
  availablePoints: integer("available_points").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ========================
// SESSIONS
// ========================
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  guideId: uuid("guide_id"),
  inviteCode: text("invite_code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  journeyData: jsonb("journey_data"),
});

// ========================
// MISSIONS
// ========================
export const missions = pgTable("missions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  xpReward: integer("xp_reward").default(100),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  radiusMeters: integer("radius_meters").default(50),
  sessionId: uuid("session_id").references(() => sessions.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ========================
// QUESTS
// ========================
export const quests = pgTable("quests", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dayNumber: integer("day_number").default(1),
  locationName: text("location_name"),
  imageUrl: text("image_url"),
  isDynamic: boolean("is_dynamic").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  pointReward: integer("point_reward").default(50),
  difficulty: text("difficulty").default("easy"),
  isDailyQuest: boolean("is_daily_quest").default(true),
  requiresCode: boolean("requires_code").default(false),
  location: text("location"),
  status: text("status").default("available"),
  category: text("category"),
  icon: text("icon").default("🎯"),
  createdBy: uuid("created_by").references(() => users.id),
  availableFrom: timestamp("available_from", { withTimezone: true }),
  isCasual: boolean("is_casual").default(true),
  missionId: uuid("mission_id").references(() => missions.id, { onDelete: "set null" }),
});

// ========================
// FEEDBACKS
// ========================
export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  questId: uuid("quest_id").notNull().references(() => quests.id),
  feedbackText: text("feedback_text"),
  rating: integer("rating"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ========================
// JOURNEY DAYS
// ========================
export const journeyDays = pgTable("journey_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ========================
// JOURNEY STEPS
// ========================
export const journeySteps = pgTable("journey_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayId: uuid("day_id").references(() => journeyDays.id),
  stepOrder: integer("step_order").notNull(),
  time: text("time"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  type: text("type").default("travel"),
  xpReward: integer("xp_reward").default(0),
  status: text("status").default("pending"),
  timeSlot: text("time_slot"),
});

// ========================
// PUSH SUBSCRIPTIONS
// ========================
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  subscription: jsonb("subscription").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ========================
// QUEST DATA
// ========================
export const questData = pgTable("quest_data", {
  id: uuid("id").defaultRandom().primaryKey(),
  questId: uuid("quest_id").notNull().references(() => quests.id).unique(),
  quizData: jsonb("quiz_data"),
  photoData: jsonb("photo_data"),
  actionData: jsonb("action_data"),
  choiceData: jsonb("choice_data"),
  timerData: jsonb("timer_data"),
  validationCode: text("validation_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ========================
// QUEST RESPONSES
// ========================
export const questResponses = pgTable("quest_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  questId: uuid("quest_id").references(() => quests.id),
  userId: uuid("user_id").references(() => users.id),
  status: text("status").default("completed"),
  responseData: jsonb("response_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ========================
// REDEEMABLES
// ========================
export const redeemables = pgTable("redeemables", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  pointCost: integer("point_cost").default(0).notNull(),
  imageUrl: text("image_url"),
  stockCount: integer("stock_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ========================
// REDEMPTION HISTORY
// ========================
export const redemptionHistory = pgTable("redemption_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  redeemableId: uuid("redeemable_id").notNull().references(() => redeemables.id),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ========================
// REDEMPTIONS
// ========================
export const redemptions = pgTable("redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  itemName: text("item_name").notNull(),
  pointsSpent: integer("points_spent").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  itemId: uuid("item_id").references(() => redeemables.id),
  status: text("status").default("pending"),
  locationNote: text("location_note"),
});

// ========================
// SESSION PARTICIPANTS
// ========================
export const sessionParticipants = pgTable("session_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id),
  userId: uuid("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
});

// ========================
// TIPS
// ========================
export const tips = pgTable("tips", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ========================
// TIMELINE ITEMS
// ========================
export const timelineItems = pgTable("timeline_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id),
  dayNumber: integer("day_number").notNull(),
  timeSlot: time("time_slot").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questId: uuid("quest_id").references(() => quests.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  tipId: uuid("tip_id").references(() => tips.id),
});

// ========================
// USER QUESTS
// ========================
export const userQuests = pgTable("user_quests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  questId: uuid("quest_id").references(() => quests.id),
  status: text("status").default("completed"),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
