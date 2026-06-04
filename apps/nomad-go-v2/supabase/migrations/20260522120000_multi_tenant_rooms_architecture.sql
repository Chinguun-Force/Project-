-- =============================================================================
-- Nomad-Go: Multi-Tenant Travel PWA — Rooms (Group Instances) Architecture
-- Target: Supabase SQL Editor / CLI migrations
-- Compatible with: Prisma introspection, Supabase Realtime, auth.users
--
-- Roles (4 only):
--   admin      — platform super admin (all tenants)
--   moderator  — travel company staff; manages company, trips, rooms, hires guides
--   guide      — field guide; belongs to one company (tenant); runs room timelines
--   tourist    — traveler; joins rooms via code; no master-template access
--
-- Isolation model:
--   tenants → trips (master templates) → master_activities
--   rooms (per micro-group) → room_activities (cloned, independently reorderable)
--   Group A timeline changes never affect Group B on the same master trip.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Extensions (Supabase ships these; safe to re-run)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Custom ENUM types (explicit for ORM introspection)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'guide',
    'tourist'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_status AS ENUM (
    'pending',
    'in_progress',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.room_status AS ENUM (
    'active',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Shared audit trigger (updated_at)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Sets updated_at to UTC now() on row UPDATE. Attach to tables with updated_at columns.';

-- ---------------------------------------------------------------------------
-- 3. Core tables
-- ---------------------------------------------------------------------------

-- Travel companies (tenants)
CREATE TABLE IF NOT EXISTS public.tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT tenants_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE TRIGGER tenants_set_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tenants_name ON public.tenants (name);

COMMENT ON TABLE public.tenants IS
  'Travel companies (multi-tenant root). Each tenant owns master trips and room instances.';

-- Profiles extend auth.users (one row per auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES public.tenants (id) ON DELETE SET NULL,
  role        public.app_role NOT NULL DEFAULT 'tourist',
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT profiles_loose_roles_may_omit_tenant CHECK (
    role IN ('tourist', 'admin') OR tenant_id IS NOT NULL
  ),
  CONSTRAINT profiles_admin_no_tenant CHECK (
    role <> 'admin' OR tenant_id IS NULL
  ),
  CONSTRAINT profiles_company_roles_need_tenant CHECK (
    role NOT IN ('moderator', 'guide') OR tenant_id IS NOT NULL
  )
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_role ON public.profiles (tenant_id, role);

COMMENT ON TABLE public.profiles IS
  'Application identity. moderator/guide belong to tenant (company). admin has no tenant.';
COMMENT ON COLUMN public.profiles.tenant_id IS
  'Company (tenant) FK. Required for moderator & guide. Nullable for tourists until onboarded.';

-- Master trip templates (per tenant)
CREATE TABLE IF NOT EXISTS public.trips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT trips_title_not_empty CHECK (char_length(trim(title)) > 0)
);

CREATE TRIGGER trips_set_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_trips_tenant_id ON public.trips (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_tenant_created ON public.trips (tenant_id, created_at DESC);

COMMENT ON TABLE public.trips IS
  'Master trip template. Never mutated by room-level realtime activity changes.';

-- Template activities (ordered blueprint)
CREATE TABLE IF NOT EXISTS public.master_activities (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                UUID NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  default_sequence_order INTEGER NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT master_activities_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT master_activities_sequence_positive CHECK (default_sequence_order >= 0),
  CONSTRAINT master_activities_trip_sequence_unique UNIQUE (trip_id, default_sequence_order)
);

CREATE TRIGGER master_activities_set_updated_at
  BEFORE UPDATE ON public.master_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_master_activities_trip_id ON public.master_activities (trip_id);
CREATE INDEX IF NOT EXISTS idx_master_activities_trip_order
  ON public.master_activities (trip_id, default_sequence_order);

COMMENT ON TABLE public.master_activities IS
  'Canonical activity sequence for a master trip. Cloned into room_activities per room.';

-- Active group instance (micro-group / coupon room)
CREATE TABLE IF NOT EXISTS public.rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  trip_id     UUID NOT NULL REFERENCES public.trips (id) ON DELETE RESTRICT,
  guide_id    UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  room_code   TEXT NOT NULL,
  status      public.room_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT rooms_code_not_empty CHECK (char_length(trim(room_code)) > 0)
);

-- room_code: globally unique coupon / invite string
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_room_code ON public.rooms (lower(room_code));
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON public.rooms (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rooms_trip_id ON public.rooms (trip_id);
CREATE INDEX IF NOT EXISTS idx_rooms_guide_id ON public.rooms (guide_id);
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_status ON public.rooms (tenant_id, status);

CREATE TRIGGER rooms_set_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.rooms IS
  'Isolated group instance. Tourists enter via room_code; timeline lives in room_activities.';
-- Enforce trip.tenant_id = room.tenant_id (CHECK cannot use subqueries in PostgreSQL)
CREATE OR REPLACE FUNCTION public.validate_room_trip_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_trip_tenant UUID;
BEGIN
  SELECT t.tenant_id INTO v_trip_tenant
  FROM public.trips t
  WHERE t.id = NEW.trip_id;

  IF v_trip_tenant IS NULL THEN
    RAISE EXCEPTION 'Trip % not found for room', NEW.trip_id;
  END IF;

  IF v_trip_tenant IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Room tenant % must match trip tenant %', NEW.tenant_id, v_trip_tenant;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rooms_validate_trip_tenant ON public.rooms;
CREATE TRIGGER trg_rooms_validate_trip_tenant
  BEFORE INSERT OR UPDATE OF tenant_id, trip_id ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_room_trip_tenant();

COMMENT ON FUNCTION public.validate_room_trip_tenant() IS
  'Prevents cross-tenant trip assignment on rooms (replaces invalid CHECK subquery).';

-- Tourist ↔ room membership
CREATE TABLE IF NOT EXISTS public.room_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES public.rooms (id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT room_members_unique_membership UNIQUE (room_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members (room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_profile_id ON public.room_members (profile_id);

COMMENT ON TABLE public.room_members IS
  'Customers gain SELECT access to a room and its activities only through this junction.';

-- Per-room realtime timeline (mutable independently per group)
CREATE TABLE IF NOT EXISTS public.room_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES public.rooms (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sequence_order  INTEGER NOT NULL,
  status          public.activity_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT room_activities_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT room_activities_sequence_non_negative CHECK (sequence_order >= 0),
  CONSTRAINT room_activities_room_sequence_unique UNIQUE (room_id, sequence_order)
);

CREATE TRIGGER room_activities_set_updated_at
  BEFORE UPDATE ON public.room_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime subscription hot paths
CREATE INDEX IF NOT EXISTS idx_room_activities_room_id ON public.room_activities (room_id);
CREATE INDEX IF NOT EXISTS idx_room_activities_room_order
  ON public.room_activities (room_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_room_activities_room_status
  ON public.room_activities (room_id, status);

COMMENT ON TABLE public.room_activities IS
  'Isolated timeline per room. Reordering here does not affect other rooms or master_activities.';

-- ---------------------------------------------------------------------------
-- 4. RLS helper functions (SECURITY DEFINER, pinned search_path)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_profile_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin'::public.app_role FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Platform super admin (role = admin).';

CREATE OR REPLACE FUNCTION public.is_company_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'moderator'::public.app_role FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.is_company_moderator() IS
  'Travel company staff (role = moderator). Manages templates, rooms, guides, tourists.';

CREATE OR REPLACE FUNCTION public.is_guide()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'guide'::public.app_role FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.is_guide() IS
  'Field guide (role = guide). Hired by company; mutates timelines for assigned rooms only.';

CREATE OR REPLACE FUNCTION public.is_tourist()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'tourist'::public.app_role FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members rm
    WHERE rm.room_id = p_room_id
      AND rm.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_guide(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rooms r
    WHERE r.id = p_room_id
      AND r.guide_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.room_tenant_id(p_room_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.rooms WHERE id = p_room_id;
$$;

CREATE OR REPLACE FUNCTION public.trip_tenant_id(p_trip_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.trips WHERE id = p_trip_id;
$$;

CREATE OR REPLACE FUNCTION public.can_access_room(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR (
      public.is_company_moderator()
      AND public.room_tenant_id(p_room_id) = public.current_profile_tenant_id()
    )
    OR public.is_room_guide(p_room_id)
    OR public.is_room_member(p_room_id);
$$;

CREATE OR REPLACE FUNCTION public.can_mutate_room_timeline(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR (
      public.is_company_moderator()
      AND public.room_tenant_id(p_room_id) = public.current_profile_tenant_id()
    )
    OR public.is_room_guide(p_room_id);
$$;

-- ---------------------------------------------------------------------------
-- 5. Signup handler: auth.users → profiles (default tourist)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, tenant_id)
  VALUES (
    NEW.id,
    'tourist',
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'playerName',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auto-provisions public.profiles for new Supabase Auth users with role=tourist.';

-- ---------------------------------------------------------------------------
-- 6. Clone master activities → room timeline
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clone_trip_to_room_internal(
  target_room_id UUID,
  source_trip_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_trip_id UUID;
  v_inserted     INTEGER;
BEGIN
  IF target_room_id IS NULL OR source_trip_id IS NULL THEN
    RAISE EXCEPTION 'target_room_id and source_trip_id are required';
  END IF;

  SELECT r.trip_id INTO v_room_trip_id
  FROM public.rooms r
  WHERE r.id = target_room_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room % not found', target_room_id;
  END IF;

  IF v_room_trip_id <> source_trip_id THEN
    RAISE EXCEPTION 'Room % is bound to trip %, not %',
      target_room_id, v_room_trip_id, source_trip_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.room_activities ra WHERE ra.room_id = target_room_id) THEN
    RAISE EXCEPTION 'Room % already has activities; clone aborted to prevent duplicates', target_room_id;
  END IF;

  INSERT INTO public.room_activities (room_id, name, sequence_order, status)
  SELECT
    target_room_id,
    ma.name,
    ma.default_sequence_order,
    'pending'::public.activity_status
  FROM public.master_activities ma
  WHERE ma.trip_id = source_trip_id
  ORDER BY ma.default_sequence_order;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

COMMENT ON FUNCTION public.clone_trip_to_room_internal(UUID, UUID) IS
  'Trusted clone (no auth). Used by AFTER INSERT trigger; do not expose to clients directly.';

CREATE OR REPLACE FUNCTION public.clone_trip_to_room(
  target_room_id UUID,
  source_trip_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_tenant UUID;
BEGIN
  SELECT r.tenant_id INTO v_room_tenant
  FROM public.rooms r
  WHERE r.id = target_room_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room % not found', target_room_id;
  END IF;

  IF NOT (
    public.is_admin()
    OR (
      public.is_company_moderator()
      AND public.current_profile_tenant_id() = v_room_tenant
    )
    OR public.is_room_guide(target_room_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to clone activities into room %', target_room_id;
  END IF;

  RETURN public.clone_trip_to_room_internal(target_room_id, source_trip_id);
END;
$$;

COMMENT ON FUNCTION public.clone_trip_to_room(UUID, UUID) IS
  'Copies master_activities into room_activities. Callable by admin, company moderator, or assigned guide.';

REVOKE ALL ON FUNCTION public.clone_trip_to_room_internal(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clone_trip_to_room_internal(UUID, UUID) FROM authenticated;

-- Auto-clone when a room row is created (runs without JWT context)
CREATE OR REPLACE FUNCTION public.on_room_created_clone_activities()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clone_trip_to_room_internal(NEW.id, NEW.trip_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_room_created_clone_activities ON public.rooms;
CREATE TRIGGER trg_room_created_clone_activities
  AFTER INSERT ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.on_room_created_clone_activities();

-- ---------------------------------------------------------------------------
-- 7. Enable RLS on ALL tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_activities ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (defense in depth on Supabase)
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.trips FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_activities FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rooms FORCE ROW LEVEL SECURITY;
ALTER TABLE public.room_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.room_activities FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 8. RLS Policies
-- ---------------------------------------------------------------------------

-- ---- tenants ----
CREATE POLICY tenants_admin_all ON public.tenants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY tenants_moderator_select_own_company ON public.tenants
  FOR SELECT TO authenticated
  USING (
    id = public.current_profile_tenant_id()
    AND public.is_company_moderator()
  );

-- ---- profiles ----
CREATE POLICY profiles_admin_all ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_self_update_tourist ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND role = 'tourist'::public.app_role)
  WITH CHECK (id = auth.uid() AND role = 'tourist'::public.app_role);

CREATE POLICY profiles_self_update_guide ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND role = 'guide'::public.app_role)
  WITH CHECK (
    id = auth.uid()
    AND role = 'guide'::public.app_role
    AND tenant_id = public.current_profile_tenant_id()
  );

-- Company moderator: hire guides, onboard tourists, manage company moderators (not admin)
CREATE POLICY profiles_moderator_manage_company_team ON public.profiles
  FOR ALL TO authenticated
  USING (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
    AND role <> 'admin'::public.app_role
  )
  WITH CHECK (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
    AND role IN (
      'moderator'::public.app_role,
      'guide'::public.app_role,
      'tourist'::public.app_role
    )
  );

CREATE POLICY profiles_company_peers_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_profile_tenant_id()
    AND tenant_id IS NOT NULL
    AND (
      public.is_company_moderator()
      OR public.is_guide()
    )
  );

-- ---- trips (master templates) — company moderator + admin only; guides/tourists denied ----
CREATE POLICY trips_admin_all ON public.trips
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY trips_moderator_manage ON public.trips
  FOR ALL TO authenticated
  USING (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
  )
  WITH CHECK (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
  );

-- ---- master_activities ----
CREATE POLICY master_activities_admin_all ON public.master_activities
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY master_activities_moderator_manage ON public.master_activities
  FOR ALL TO authenticated
  USING (
    public.is_company_moderator()
    AND public.trip_tenant_id(trip_id) = public.current_profile_tenant_id()
  )
  WITH CHECK (
    public.is_company_moderator()
    AND public.trip_tenant_id(trip_id) = public.current_profile_tenant_id()
  );

-- ---- rooms ----
CREATE POLICY rooms_admin_all ON public.rooms
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY rooms_moderator_manage ON public.rooms
  FOR ALL TO authenticated
  USING (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
  )
  WITH CHECK (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
  );

CREATE POLICY rooms_tourist_select_member ON public.rooms
  FOR SELECT TO authenticated
  USING (public.is_room_member(id));

CREATE POLICY rooms_guide_select_assigned ON public.rooms
  FOR SELECT TO authenticated
  USING (guide_id = auth.uid());

-- ---- room_members ----
CREATE POLICY room_members_admin_all ON public.room_members
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY room_members_moderator_manage ON public.room_members
  FOR ALL TO authenticated
  USING (
    public.is_company_moderator()
    AND public.room_tenant_id(room_id) = public.current_profile_tenant_id()
  )
  WITH CHECK (
    public.is_company_moderator()
    AND public.room_tenant_id(room_id) = public.current_profile_tenant_id()
  );

CREATE POLICY room_members_tourist_select_own_room ON public.room_members
  FOR SELECT TO authenticated
  USING (
    public.is_room_member(room_id)
    OR profile_id = auth.uid()
  );

-- ---- room_activities (isolated realtime timeline) ----
CREATE POLICY room_activities_admin_all ON public.room_activities
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY room_activities_select_scoped ON public.room_activities
  FOR SELECT TO authenticated
  USING (public.can_access_room(room_id));

CREATE POLICY room_activities_insert_moderator_guide ON public.room_activities
  FOR INSERT TO authenticated
  WITH CHECK (public.can_mutate_room_timeline(room_id));

CREATE POLICY room_activities_update_moderator_guide ON public.room_activities
  FOR UPDATE TO authenticated
  USING (public.can_mutate_room_timeline(room_id))
  WITH CHECK (public.can_mutate_room_timeline(room_id));

CREATE POLICY room_activities_delete_moderator_guide ON public.room_activities
  FOR DELETE TO authenticated
  USING (public.can_mutate_room_timeline(room_id));

-- tourists: SELECT only via can_access_room; guides/moderators mutate per can_mutate_room_timeline

-- ---------------------------------------------------------------------------
-- 9. Grants (Supabase roles)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.clone_trip_to_room(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_company_moderator() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_guide() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_room(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_mutate_room_timeline(UUID) TO authenticated, service_role;

COMMIT;

-- =============================================================================
-- POST-DEPLOY NOTES (run manually if needed)
-- =============================================================================
-- 1) Existing legacy tables (users, sessions, quests, …) are untouched.
--    Migrate data or rename in a follow-up migration before cutover.
-- 2) Optional: join_room_by_code(room_code) RPC for coupon redemption (SECURITY DEFINER).
-- 3) Prisma: npx prisma db pull after applying this migration.
-- 4) Realtime: enable replication for room_activities in Supabase Dashboard.
-- 5) Roles: admin | moderator (company) | guide (company employee) | tourist
-- =============================================================================
