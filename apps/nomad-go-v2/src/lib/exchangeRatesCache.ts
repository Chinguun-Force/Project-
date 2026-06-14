import type { ExchangeRates } from "@/app/actions/currencyActions";

const KEY = "nomad:exchange-rates";

export function readExchangeRatesCache(): ExchangeRates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExchangeRates;
    if (
      !parsed ||
      typeof parsed.base !== "string" ||
      typeof parsed.date !== "string" ||
      !parsed.rates ||
      typeof parsed.rates !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeExchangeRatesCache(data: ExchangeRates): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded — in-memory state still works for this session.
  }
}
