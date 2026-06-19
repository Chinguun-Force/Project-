-- Allow unassigned guides (tenant_id NULL) alongside tourist/admin.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_loose_roles_may_omit_tenant;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_loose_roles_may_omit_tenant CHECK (
  role IN ('tourist', 'admin', 'guide') OR tenant_id IS NOT NULL
);
