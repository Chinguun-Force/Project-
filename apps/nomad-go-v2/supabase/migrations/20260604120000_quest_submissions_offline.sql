-- Offline-first quest submissions: client-generated UUID primary keys.
-- Idempotent bulk upsert on sync; device_timestamp preserves remote completion time.

CREATE TABLE IF NOT EXISTS public.quest_submissions (
  id                UUID PRIMARY KEY,
  quest_id          UUID NOT NULL REFERENCES public.quests (id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  room_id           UUID REFERENCES public.rooms (id) ON DELETE SET NULL,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_synced         BOOLEAN NOT NULL DEFAULT false,
  device_timestamp  TIMESTAMPTZ NOT NULL,
  synced_at         TIMESTAMPTZ,
  is_approved       BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_quest_submissions_user_synced
  ON public.quest_submissions (user_id, is_synced);

CREATE INDEX IF NOT EXISTS idx_quest_submissions_quest_id
  ON public.quest_submissions (quest_id);

COMMENT ON TABLE public.quest_submissions IS
  'Offline-capable quest completions. id is client-generated (UUID v4) before sync.';

ALTER TABLE public.quest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_submissions FORCE ROW LEVEL SECURITY;

-- Tourist inserts/selects own rows; sync API marks is_synced server-side.
CREATE POLICY quest_submissions_select_own ON public.quest_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY quest_submissions_insert_own ON public.quest_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY quest_submissions_update_own ON public.quest_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY quest_submissions_admin_all ON public.quest_submissions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.quest_submissions TO authenticated;
GRANT ALL ON public.quest_submissions TO service_role;
