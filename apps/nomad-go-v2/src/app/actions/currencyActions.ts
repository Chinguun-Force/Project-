"use server";

import {
  createClient as createServiceClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/utils/supabase/config";

export type ExchangeRates = {
  base: string;
  rates: Record<string, number>;
  /** YYYY-MM-DD the rates were cached for. */
  date: string;
  /** True when served from the daily DB cache rather than a fresh fetch. */
  cached: boolean;
};

const BASE_CODE = "MNT";

function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  const { url } = getSupabaseConfig();
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns exchange rates (base MNT), hitting the provider at most once per
 * calendar day. The result is cached in a single `exchange_rates` row that is
 * upserted (never appended) on each refresh. On provider failure we gracefully
 * fall back to the last cached value so the tool keeps working offline-ish.
 */
export async function getExchangeRatesAction(): Promise<ExchangeRates> {
  const supabase = serviceClient();
  const today = todayUtc();

  const { data: existing } = await supabase
    .from("exchange_rates")
    .select("base_code, rates, rate_date")
    .eq("base_code", BASE_CODE)
    .maybeSingle();

  if (existing && existing.rate_date === today) {
    return {
      base: existing.base_code,
      rates: existing.rates as Record<string, number>,
      date: existing.rate_date,
      cached: true,
    };
  }

  const apiKey = process.env.EXCHANGERATE_API_KEY;
  if (!apiKey) {
    if (existing) {
      return {
        base: existing.base_code,
        rates: existing.rates as Record<string, number>,
        date: existing.rate_date,
        cached: true,
      };
    }
    throw new Error("Currency tool is not configured (missing EXCHANGERATE_API_KEY).");
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${BASE_CODE}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`Rate provider responded ${res.status}`);

    const json = (await res.json()) as {
      result?: string;
      conversion_rates?: Record<string, number>;
      time_last_update_utc?: string;
    };

    if (json.result !== "success" || !json.conversion_rates) {
      throw new Error("Rate provider returned an unexpected payload");
    }

    const rates = json.conversion_rates;
    const providerUpdatedAt = json.time_last_update_utc
      ? new Date(json.time_last_update_utc).toISOString()
      : null;

    await supabase.from("exchange_rates").upsert(
      {
        base_code: BASE_CODE,
        rates,
        rate_date: today,
        provider_updated_at: providerUpdatedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "base_code" },
    );

    return { base: BASE_CODE, rates, date: today, cached: false };
  } catch (err) {
    // Graceful degradation: serve stale cache if we have one.
    if (existing) {
      return {
        base: existing.base_code,
        rates: existing.rates as Record<string, number>,
        date: existing.rate_date,
        cached: true,
      };
    }
    throw err instanceof Error
      ? err
      : new Error("Failed to load exchange rates");
  }
}
