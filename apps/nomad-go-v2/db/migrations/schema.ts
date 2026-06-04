import { pgTable, index, foreignKey, check, uuid, text, integer, timestamp, time, unique, jsonb, pgPolicy, bigint, boolean, doublePrecision, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const user_role = pgEnum("user_role", ['user', 'admin', 'tourist', 'guide'])


export const feedbacks = pgTable("feedbacks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	quest_id: uuid().notNull(),
	feedback_text: text(),
	rating: integer(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("feedbacks_quest_id_idx").using("btree", table.quest_id.asc().nullsLast().op("uuid_ops")),
	index("feedbacks_user_id_idx").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	index("idx_feedbacks_created_at").using("btree", table.created_at.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_feedbacks_quest_id").using("btree", table.quest_id.asc().nullsLast().op("uuid_ops")),
	index("idx_feedbacks_user_id").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.quest_id],
			foreignColumns: [quests.id],
			name: "feedbacks_quest_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "feedbacks_user_id_fkey"
		}).onDelete("cascade"),
	check("feedbacks_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const timeline_items = pgTable("timeline_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	session_id: uuid(),
	day_number: integer().notNull(),
	time_slot: time().notNull(),
	title: text().notNull(),
	description: text(),
	quest_id: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	tip_id: uuid(),
}, (table) => [
	index("idx_timeline_session_id").using("btree", table.session_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.quest_id],
			foreignColumns: [quests.id],
			name: "timeline_items_quest_id_fkey"
		}),
	foreignKey({
			columns: [table.session_id],
			foreignColumns: [sessions.id],
			name: "timeline_items_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tip_id],
			foreignColumns: [tips.id],
			name: "timeline_items_tip_id_fkey"
		}).onDelete("set null"),
]);

export const quest_responses = pgTable("quest_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quest_id: uuid(),
	user_id: uuid(),
	status: text().default('completed'),
	response_data: jsonb(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_quest_responses_quest_id").using("btree", table.quest_id.asc().nullsLast().op("uuid_ops")),
	index("idx_quest_responses_user_id").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.quest_id],
			foreignColumns: [quests.id],
			name: "quest_responses_quest_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "quest_responses_user_id_fkey"
		}).onDelete("cascade"),
	unique("quest_responses_quest_id_user_id_key").on(table.quest_id, table.user_id),
]);

export const user_quests = pgTable("user_quests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid(),
	quest_id: uuid(),
	status: text().default('completed'),
	completed_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.quest_id],
			foreignColumns: [quests.id],
			name: "user_quests_quest_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "user_quests_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_quests_user_id_quest_id_key").on(table.user_id, table.quest_id),
	pgPolicy("Admins have full access to user_quests", { as: "permissive", for: "all", to: ["service_role"], using: sql`true` }),
	pgPolicy("Users can view their own quest completions", { as: "permissive", for: "select", to: ["public"] }),
	check("user_quests_status_check", sql`status = ANY (ARRAY['pending'::text, 'completed'::text])`),
]);

export const redeemables = pgTable("redeemables", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	point_cost: integer().default(0).notNull(),
	image_url: text(),
	stock_count: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_redeemables_point_cost").using("btree", table.point_cost.asc().nullsLast().op("int4_ops")),
	index("idx_redeemables_stock_count").using("btree", table.stock_count.asc().nullsLast().op("int4_ops")),
	check("redeemables_point_cost_check", sql`point_cost >= 0`),
	check("redeemables_stock_count_check", sql`stock_count >= 0`),
]);

export const redemption_history = pgTable("redemption_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	redeemable_id: uuid().notNull(),
	status: text().default('pending').notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_redemption_history_created_at").using("btree", table.created_at.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_redemption_history_redeemable_id").using("btree", table.redeemable_id.asc().nullsLast().op("uuid_ops")),
	index("idx_redemption_history_user_id").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	index("redemption_history_redeemable_id_idx").using("btree", table.redeemable_id.asc().nullsLast().op("uuid_ops")),
	index("redemption_history_user_id_idx").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.redeemable_id],
			foreignColumns: [redeemables.id],
			name: "redemption_history_redeemable_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "redemption_history_user_id_fkey"
		}).onDelete("cascade"),
	check("redemption_history_status_check", sql`status = ANY (ARRAY['pending'::text, 'claimed'::text])`),
]);

export const users = pgTable("users", {
	id: uuid().primaryKey().notNull(),
	full_name: text(),
	role: text().default('user').notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	email: text(),
	level: integer().default(1),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total_xp: bigint({ mode: "number" }).default(0),
	completed_quests: integer().default(0),
	avatar_url: text(),
	session_id: uuid().default(sql`'12a65926-7c31-475d-a42d-8fce12c6c9ec'`),
	available_points: integer().default(0).notNull(),
	xp_threshold: integer().default(1000),
	current_xp: integer().default(0),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [table.id],
			name: "users_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.session_id],
			foreignColumns: [sessions.id],
			name: "users_session_id_fkey"
		}),
	pgPolicy("admin-access: insert", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`is_admin()`  }),
	pgPolicy("admin-access: select", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("admin-access: update", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("self-access: insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("self-access: select", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("self-access: update", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("users_role_check", sql`role = ANY (ARRAY['user'::text, 'moderator'::text, 'admin'::text, 'tourist'::text, 'guide'::text])`),
]);

export const quests = pgTable("quests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	session_id: uuid(),
	type: text().notNull(),
	title: text().notNull(),
	description: text(),
	day_number: integer().default(1),
	location_name: text(),
	image_url: text(),
	is_dynamic: boolean().default(false),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	point_reward: integer().default(50),
	difficulty: text().default('easy'),
	is_daily_quest: boolean().default(true),
	requires_code: boolean().default(false),
	location: text(),
	status: text().default('available'),
	category: text(),
	icon: text().default('🎯'),
	created_by: uuid(),
	available_from: timestamp({ withTimezone: true, mode: 'string' }),
	is_casual: boolean().default(true),
	mission_id: uuid(),
}, (table) => [
	index("idx_quests_session_id").using("btree", table.session_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.created_by],
			foreignColumns: [users.id],
			name: "quests_created_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.mission_id],
			foreignColumns: [missions.id],
			name: "quests_mission_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.session_id],
			foreignColumns: [sessions.id],
			name: "quests_session_id_fkey"
		}).onDelete("cascade"),
	check("quests_difficulty_check", sql`difficulty = ANY (ARRAY['available'::text, 'easy'::text, 'medium'::text, 'hard'::text])`),
	check("quests_type_check", sql`type = ANY (ARRAY['quiz'::text, 'photo'::text, 'action'::text, 'choice'::text, 'timer'::text])`),
]);

export const journey_days = pgTable("journey_days", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	session_id: uuid(),
	day_number: integer().notNull(),
	title: text().notNull(),
	location: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_journey_days_session_day").using("btree", table.session_id.asc().nullsLast().op("int4_ops"), table.day_number.asc().nullsLast().op("int4_ops")),
	index("idx_journey_days_session_id").using("btree", table.session_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.session_id],
			foreignColumns: [sessions.id],
			name: "journey_days_session_id_fkey"
		}).onDelete("cascade"),
]);

export const journey_steps = pgTable("journey_steps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	day_id: uuid(),
	step_order: integer().notNull(),
	time: text(),
	title: text().notNull(),
	subtitle: text(),
	description: text(),
	type: text().default('travel'),
	xp_reward: integer().default(100),
	status: text().default('pending'),
	time_slot: text(),
}, (table) => [
	index("idx_journey_steps_day_id").using("btree", table.day_id.asc().nullsLast().op("uuid_ops")),
	index("idx_journey_steps_day_order").using("btree", table.day_id.asc().nullsLast().op("int4_ops"), table.step_order.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.day_id],
			foreignColumns: [journey_days.id],
			name: "journey_steps_day_id_fkey"
		}).onDelete("cascade"),
	check("journey_steps_status_check", sql`status = ANY (ARRAY['pending'::text, 'available'::text, 'active'::text, 'completed'::text, 'locked'::text])`),
]);

export const quest_data = pgTable("quest_data", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quest_id: uuid().notNull(),
	quiz_data: jsonb(),
	photo_data: jsonb(),
	action_data: jsonb(),
	choice_data: jsonb(),
	timer_data: jsonb(),
	validation_code: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.quest_id],
			foreignColumns: [quests.id],
			name: "quest_data_quest_id_fkey"
		}).onDelete("cascade"),
	unique("quest_data_quest_id_key").on(table.quest_id),
]);

export const tips = pgTable("tips", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	location: text(),
	category: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const push_subscriptions = pgTable("push_subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	endpoint: text().notNull(),
	subscription: jsonb().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("push_subscriptions_user_id_idx").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "push_subscriptions_user_id_fkey"
		}).onDelete("cascade"),
	unique("push_subscriptions_endpoint_key").on(table.endpoint),
]);

export const missions = pgTable("missions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	image_url: text(),
	xp_reward: integer().default(100),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	latitude: doublePrecision(),
	longitude: doublePrecision(),
	radius_meters: integer().default(50),
});

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	location: text().notNull(),
	start_date: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	end_date: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	guide_id: uuid(),
	invite_code: text().notNull(),
	is_active: boolean().default(true),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	image_url: text(),
	price: numeric().default('0'),
	duration_days: integer().default(1),
	contact_email: text(),
	contact_phone: text(),
	viber_link: text(),
}, (table) => [
	index("idx_sessions_guide_id").using("btree", table.guide_id.asc().nullsLast().op("uuid_ops")),
	unique("sessions_invite_code_key").on(table.invite_code),
]);

export const session_missions = pgTable("session_missions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	session_id: uuid().notNull(),
	mission_id: uuid().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_session_missions_mission_id").using("btree", table.mission_id.asc().nullsLast().op("uuid_ops")),
	index("idx_session_missions_session_id").using("btree", table.session_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.mission_id],
			foreignColumns: [missions.id],
			name: "session_missions_mission_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.session_id],
			foreignColumns: [sessions.id],
			name: "session_missions_session_id_fkey"
		}).onDelete("cascade"),
	unique("session_missions_unique").on(table.session_id, table.mission_id),
]);

export const session_participants = pgTable("session_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	session_id: uuid(),
	user_id: uuid(),
	joined_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.session_id],
			foreignColumns: [sessions.id],
			name: "session_participants_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "session_participants_user_id_fkey"
		}).onDelete("cascade"),
	unique("session_participants_session_id_user_id_key").on(table.session_id, table.user_id),
]);
