-- Per-user mission completions (geofence dwell). Idempotent via unique(user_id, mission_id).
CREATE TABLE IF NOT EXISTS public.user_missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  mission_id    UUID NOT NULL REFERENCES public.missions (id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'completed',
  xp_awarded    INTEGER NOT NULL DEFAULT 0,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_missions_user_id
  ON public.user_missions (user_id);

COMMENT ON TABLE public.user_missions IS
  'Geofence-completed missions per user (10-min in-radius dwell). XP granted once.';

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_missions_select_own ON public.user_missions;
CREATE POLICY user_missions_select_own ON public.user_missions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_missions_insert_own ON public.user_missions;
CREATE POLICY user_missions_insert_own ON public.user_missions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
