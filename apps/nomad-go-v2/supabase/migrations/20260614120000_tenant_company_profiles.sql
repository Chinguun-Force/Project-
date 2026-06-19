-- Company profile fields on tenants + marketplace read / moderator update policies.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN public.tenants.description IS
  'Public company bio shown on the tour marketplace.';
COMMENT ON COLUMN public.tenants.logo_url IS
  'Company logo URL (Supabase Storage quest-media/companies/…).';
COMMENT ON COLUMN public.tenants.contact_email IS
  'Optional public contact email for travelers.';
COMMENT ON COLUMN public.tenants.website IS
  'Optional company website URL.';
COMMENT ON COLUMN public.tenants.location IS
  'Optional HQ or primary operating region label.';

-- Moderators may edit their own company profile (not other tenants).
DROP POLICY IF EXISTS tenants_moderator_update_own_company ON public.tenants;
CREATE POLICY tenants_moderator_update_own_company ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    id = public.current_profile_tenant_id()
    AND public.is_company_moderator()
  )
  WITH CHECK (
    id = public.current_profile_tenant_id()
    AND public.is_company_moderator()
  );

-- Tourists/staff may read tenants that operate published marketplace trips.
DROP POLICY IF EXISTS tenants_marketplace_read ON public.tenants;
CREATE POLICY tenants_marketplace_read ON public.tenants
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      id = public.current_profile_tenant_id()
      AND public.is_staff_user()
    )
    OR EXISTS (
      SELECT 1
      FROM public.trips t
      WHERE t.tenant_id = tenants.id
        AND t.is_published = true
    )
  );

-- Published trip templates are readable by any signed-in traveler (marketplace).
DROP POLICY IF EXISTS trips_authenticated_read_published ON public.trips;
CREATE POLICY trips_authenticated_read_published ON public.trips
  FOR SELECT TO authenticated
  USING (is_published = true);

-- Itinerary preview on published trip detail pages.
DROP POLICY IF EXISTS master_activities_read_published_trips ON public.master_activities;
CREATE POLICY master_activities_read_published_trips ON public.master_activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.trips t
      WHERE t.id = master_activities.trip_id
        AND t.is_published = true
    )
  );
