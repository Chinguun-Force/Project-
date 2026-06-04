-- Marketplace card fields for trip templates (Tours page)

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.trips.is_published IS
  'When true, trip template is listed on the tourist Tours marketplace.';
