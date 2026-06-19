-- Unassigned platform guides + company hire requests with guide confirmation.

DO $$ BEGIN
  CREATE TYPE public.hire_request_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Guides may exist without a company until they accept a hire invite.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_roles_need_tenant;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_loose_roles_may_omit_tenant;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_loose_roles_may_omit_tenant CHECK (
  role IN ('tourist', 'admin', 'guide') OR tenant_id IS NOT NULL
);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_moderator_needs_tenant CHECK (
  role <> 'moderator' OR tenant_id IS NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guide_hire_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  guide_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  invited_by   UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status       public.hire_request_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  responded_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS guide_hire_requests_one_pending_per_pair
  ON public.guide_hire_requests (tenant_id, guide_id)
  WHERE status = 'pending'::public.hire_request_status;

CREATE INDEX IF NOT EXISTS idx_guide_hire_requests_guide_status
  ON public.guide_hire_requests (guide_id, status);

CREATE INDEX IF NOT EXISTS idx_guide_hire_requests_tenant_status
  ON public.guide_hire_requests (tenant_id, status);

COMMENT ON TABLE public.guide_hire_requests IS
  'Company moderator invites an admin-approved guide; guide must accept before tenant_id is set.';

ALTER TABLE public.guide_hire_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guide_hire_requests_admin_all ON public.guide_hire_requests;
CREATE POLICY guide_hire_requests_admin_all ON public.guide_hire_requests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS guide_hire_requests_moderator_select ON public.guide_hire_requests;
CREATE POLICY guide_hire_requests_moderator_select ON public.guide_hire_requests
  FOR SELECT TO authenticated
  USING (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
  );

DROP POLICY IF EXISTS guide_hire_requests_moderator_insert ON public.guide_hire_requests;
CREATE POLICY guide_hire_requests_moderator_insert ON public.guide_hire_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
    AND invited_by = auth.uid()
    AND status = 'pending'::public.hire_request_status
  );

DROP POLICY IF EXISTS guide_hire_requests_moderator_cancel ON public.guide_hire_requests;
CREATE POLICY guide_hire_requests_moderator_cancel ON public.guide_hire_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
    AND status = 'pending'::public.hire_request_status
  )
  WITH CHECK (
    public.is_company_moderator()
    AND tenant_id = public.current_profile_tenant_id()
    AND status = 'cancelled'::public.hire_request_status
  );

DROP POLICY IF EXISTS guide_hire_requests_guide_select ON public.guide_hire_requests;
CREATE POLICY guide_hire_requests_guide_select ON public.guide_hire_requests
  FOR SELECT TO authenticated
  USING (guide_id = auth.uid() AND public.is_guide());

DROP POLICY IF EXISTS guide_hire_requests_guide_respond ON public.guide_hire_requests;
CREATE POLICY guide_hire_requests_guide_respond ON public.guide_hire_requests
  FOR UPDATE TO authenticated
  USING (
    guide_id = auth.uid()
    AND public.is_guide()
    AND status = 'pending'::public.hire_request_status
  )
  WITH CHECK (
    guide_id = auth.uid()
    AND status IN ('accepted'::public.hire_request_status, 'declined'::public.hire_request_status)
  );
