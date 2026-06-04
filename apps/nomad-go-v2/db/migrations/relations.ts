import { relations } from "drizzle-orm/relations";
import { quests, feedbacks, users, timeline_items, sessions, tips, quest_responses, user_quests, redeemables, redemption_history, usersInAuth, missions, journey_days, journey_steps, quest_data, push_subscriptions, session_missions, session_participants } from "./schema";

export const feedbacksRelations = relations(feedbacks, ({one}) => ({
	quest: one(quests, {
		fields: [feedbacks.quest_id],
		references: [quests.id]
	}),
	user: one(users, {
		fields: [feedbacks.user_id],
		references: [users.id]
	}),
}));

export const questsRelations = relations(quests, ({one, many}) => ({
	feedbacks: many(feedbacks),
	timeline_items: many(timeline_items),
	quest_responses: many(quest_responses),
	user_quests: many(user_quests),
	user: one(users, {
		fields: [quests.created_by],
		references: [users.id]
	}),
	mission: one(missions, {
		fields: [quests.mission_id],
		references: [missions.id]
	}),
	session: one(sessions, {
		fields: [quests.session_id],
		references: [sessions.id]
	}),
	quest_data: many(quest_data),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	feedbacks: many(feedbacks),
	quest_responses: many(quest_responses),
	user_quests: many(user_quests),
	redemption_histories: many(redemption_history),
	usersInAuth: one(usersInAuth, {
		fields: [users.id],
		references: [usersInAuth.id]
	}),
	session: one(sessions, {
		fields: [users.session_id],
		references: [sessions.id]
	}),
	quests: many(quests),
	push_subscriptions: many(push_subscriptions),
	session_participants: many(session_participants),
}));

export const timeline_itemsRelations = relations(timeline_items, ({one}) => ({
	quest: one(quests, {
		fields: [timeline_items.quest_id],
		references: [quests.id]
	}),
	session: one(sessions, {
		fields: [timeline_items.session_id],
		references: [sessions.id]
	}),
	tip: one(tips, {
		fields: [timeline_items.tip_id],
		references: [tips.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({many}) => ({
	timeline_items: many(timeline_items),
	users: many(users),
	quests: many(quests),
	journey_days: many(journey_days),
	session_missions: many(session_missions),
	session_participants: many(session_participants),
}));

export const tipsRelations = relations(tips, ({many}) => ({
	timeline_items: many(timeline_items),
}));

export const quest_responsesRelations = relations(quest_responses, ({one}) => ({
	quest: one(quests, {
		fields: [quest_responses.quest_id],
		references: [quests.id]
	}),
	user: one(users, {
		fields: [quest_responses.user_id],
		references: [users.id]
	}),
}));

export const user_questsRelations = relations(user_quests, ({one}) => ({
	quest: one(quests, {
		fields: [user_quests.quest_id],
		references: [quests.id]
	}),
	user: one(users, {
		fields: [user_quests.user_id],
		references: [users.id]
	}),
}));

export const redemption_historyRelations = relations(redemption_history, ({one}) => ({
	redeemable: one(redeemables, {
		fields: [redemption_history.redeemable_id],
		references: [redeemables.id]
	}),
	user: one(users, {
		fields: [redemption_history.user_id],
		references: [users.id]
	}),
}));

export const redeemablesRelations = relations(redeemables, ({many}) => ({
	redemption_histories: many(redemption_history),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	users: many(users),
}));

export const missionsRelations = relations(missions, ({many}) => ({
	quests: many(quests),
	session_missions: many(session_missions),
}));

export const journey_daysRelations = relations(journey_days, ({one, many}) => ({
	session: one(sessions, {
		fields: [journey_days.session_id],
		references: [sessions.id]
	}),
	journey_steps: many(journey_steps),
}));

export const journey_stepsRelations = relations(journey_steps, ({one}) => ({
	journey_day: one(journey_days, {
		fields: [journey_steps.day_id],
		references: [journey_days.id]
	}),
}));

export const quest_dataRelations = relations(quest_data, ({one}) => ({
	quest: one(quests, {
		fields: [quest_data.quest_id],
		references: [quests.id]
	}),
}));

export const push_subscriptionsRelations = relations(push_subscriptions, ({one}) => ({
	user: one(users, {
		fields: [push_subscriptions.user_id],
		references: [users.id]
	}),
}));

export const session_missionsRelations = relations(session_missions, ({one}) => ({
	mission: one(missions, {
		fields: [session_missions.mission_id],
		references: [missions.id]
	}),
	session: one(sessions, {
		fields: [session_missions.session_id],
		references: [sessions.id]
	}),
}));

export const session_participantsRelations = relations(session_participants, ({one}) => ({
	session: one(sessions, {
		fields: [session_participants.session_id],
		references: [sessions.id]
	}),
	user: one(users, {
		fields: [session_participants.user_id],
		references: [users.id]
	}),
}));