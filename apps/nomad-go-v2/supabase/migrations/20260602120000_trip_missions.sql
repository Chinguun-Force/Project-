-- Link tour templates (trips) to gamification sights (missions)

CREATE TABLE IF NOT EXISTS public.trip_missions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  mission_id  UUID NOT NULL REFERENCES public.missions (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT trip_missions_unique UNIQUE (trip_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_missions_trip_id ON public.trip_missions (trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_missions_mission_id ON public.trip_missions (mission_id);

COMMENT ON TABLE public.trip_missions IS
  'Sights (missions) included in a tour template. Rooms inherit via rooms.trip_id.';

ALTER TABLE public.trip_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_missions FORCE ROW LEVEL SECURITY;

CREATE POLICY trip_missions_admin_all ON public.trip_missions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY trip_missions_moderator_manage ON public.trip_missions
  FOR ALL TO authenticated
  USING (
    public.is_company_moderator()
    AND public.trip_tenant_id(trip_id) = public.current_profile_tenant_id()
  )
  WITH CHECK (
    public.is_company_moderator()
    AND public.trip_tenant_id(trip_id) = public.current_profile_tenant_id()
  );

CREATE POLICY trip_missions_select_authenticated ON public.trip_missions
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_missions TO authenticated, service_role;
