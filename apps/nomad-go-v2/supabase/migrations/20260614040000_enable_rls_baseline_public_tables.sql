-- =====================================================================
-- RLS baseline for public tables flagged by the Supabase security advisor.
-- Strategy: enable RLS everywhere + least-privilege policies that keep
-- current app behaviour. All privileged writes already go through the
-- service role (admin client / server actions), which bypasses RLS.
-- Applied via Supabase MCP on 2026-06-14.
-- =====================================================================

-- ---------- Content catalogs: any signed-in traveler may read ----------
ALTER TABLE public.quests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_data    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_days  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quests_read_authenticated ON public.quests;
CREATE POLICY quests_read_authenticated ON public.quests
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS quest_data_read_authenticated ON public.quest_data;
CREATE POLICY quest_data_read_authenticated ON public.quest_data
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS missions_read_authenticated ON public.missions;
CREATE POLICY missions_read_authenticated ON public.missions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS redeemables_read_authenticated ON public.redeemables;
CREATE POLICY redeemables_read_authenticated ON public.redeemables
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS tips_read_authenticated ON public.tips;
CREATE POLICY tips_read_authenticated ON public.tips
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS journey_days_read_authenticated ON public.journey_days;
CREATE POLICY journey_days_read_authenticated ON public.journey_days
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS journey_steps_read_authenticated ON public.journey_steps;
CREATE POLICY journey_steps_read_authenticated ON public.journey_steps
  FOR SELECT TO authenticated USING (true);

-- ---------- User-owned rows: self access (writes also via service role) ----------
-- user_quests already has: SELECT self + ALL service_role. Add self write so the
-- authenticated complete/sync routes can record completions.
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_quests_self_insert ON public.user_quests;
CREATE POLICY user_quests_self_insert ON public.user_quests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_quests_self_update ON public.user_quests;
CREATE POLICY user_quests_self_update ON public.user_quests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.quest_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quest_responses_self_select ON public.quest_responses;
CREATE POLICY quest_responses_self_select ON public.quest_responses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS quest_responses_self_insert ON public.quest_responses;
CREATE POLICY quest_responses_self_insert ON public.quest_responses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS quest_responses_self_update ON public.quest_responses;
CREATE POLICY quest_responses_self_update ON public.quest_responses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.redemption_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS redemption_history_self_select ON public.redemption_history;
CREATE POLICY redemption_history_self_select ON public.redemption_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedbacks_self_select ON public.feedbacks;
CREATE POLICY feedbacks_self_select ON public.feedbacks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS feedbacks_self_insert ON public.feedbacks;
CREATE POLICY feedbacks_self_insert ON public.feedbacks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- users already has self + admin policies; just turn RLS on so they take effect.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ---------- Legacy session-era tables (sessions API is 410): staff-only read ----------
ALTER TABLE public.sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_missions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_items       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_staff_read ON public.sessions;
CREATE POLICY sessions_staff_read ON public.sessions
  FOR SELECT TO authenticated USING (public.is_staff_user());

DROP POLICY IF EXISTS session_missions_staff_read ON public.session_missions;
CREATE POLICY session_missions_staff_read ON public.session_missions
  FOR SELECT TO authenticated USING (public.is_staff_user());

DROP POLICY IF EXISTS session_participants_staff_read ON public.session_participants;
CREATE POLICY session_participants_staff_read ON public.session_participants
  FOR SELECT TO authenticated USING (public.is_staff_user());

DROP POLICY IF EXISTS timeline_items_staff_read ON public.timeline_items;
CREATE POLICY timeline_items_staff_read ON public.timeline_items
  FOR SELECT TO authenticated USING (public.is_staff_user());
