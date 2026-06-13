-- Daily-cached currency exchange rates (base MNT).
--
-- A single row per base currency. The server fetches the provider once per
-- calendar day and upserts (updates) this row, so we never accumulate history
-- and we minimise outbound API calls / egress.

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  base_code           TEXT PRIMARY KEY,
  rates               JSONB NOT NULL,
  rate_date           DATE NOT NULL,
  provider_updated_at TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.exchange_rates IS
  'Single-row-per-base currency rate cache; refreshed at most once per day via upsert.';

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may read the cached rates. Writes happen only through
-- the service role (which bypasses RLS), so no write policy is granted.
DROP POLICY IF EXISTS exchange_rates_read ON public.exchange_rates;
CREATE POLICY exchange_rates_read ON public.exchange_rates
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.exchange_rates TO authenticated;
