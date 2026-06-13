"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, RefreshCw, Coins, ChevronLeft, X } from "lucide-react";
import {
  getExchangeRatesAction,
  type ExchangeRates,
} from "@/app/actions/currencyActions";
import { Spinner } from "@/components/ui/spinner";

/** Tourist-friendly currencies pinned to the top of the pickers. */
const POPULAR: { code: string; label: string }[] = [
  { code: "MNT", label: "Mongolian Tögrög" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "RUB", label: "Russian Ruble" },
  { code: "KRW", label: "South Korean Won" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "GBP", label: "British Pound" },
  { code: "KZT", label: "Kazakhstani Tenge" },
  { code: "TRY", label: "Turkish Lira" },
];

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const fractionDigits = value >= 100 ? 2 : value >= 1 ? 3 : 4;
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Strip to a raw numeric string (digits + a single decimal point). */
function toRawNumber(input: string): string {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  // Keep only the first decimal point.
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
}

/** Group the integer part with thousands separators for display (e.g. 10,000). */
function groupDigits(raw: string): string {
  if (!raw) return "";
  const [intPart, decPart] = raw.split(".");
  const grouped = (intPart || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
}

/**
 * Edge-docked currency converter. Behaves like a social rail: a slim handle
 * stays pinned to the right edge and the panel slides out on tap. No route
 * change, no modal overlay — it simply expands in place.
 */
export function CurrencyConverter() {
  const [open, setOpen] = useState(false);

  const [data, setData] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tourists usually read a Tögrög price in a shop and want it in their own
  // currency, so the input side defaults to MNT.
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState("MNT");
  const [to, setTo] = useState("USD");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rates = await getExchangeRatesAction();
      setData(rates);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load exchange rates.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Lazy-load rates the first time the panel is opened.
  useEffect(() => {
    if (open && !data && !loading) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const options = useMemo(() => {
    if (!data) return POPULAR;
    const all = Object.keys(data.rates);
    const popularCodes = POPULAR.filter((p) => all.includes(p.code));
    const popularSet = new Set(popularCodes.map((p) => p.code));
    const rest = all
      .filter((c) => !popularSet.has(c))
      .sort()
      .map((code) => ({ code, label: code }));
    return [...popularCodes, ...rest];
  }, [data]);

  const result = useMemo(() => {
    if (!data) return null;
    const value = parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(value)) return null;
    const rateFrom = data.rates[from];
    const rateTo = data.rates[to];
    if (!rateFrom || !rateTo) return null;
    return (value * rateTo) / rateFrom;
  }, [amount, from, to, data]);

  const unitRate = useMemo(() => {
    if (!data) return null;
    const rateFrom = data.rates[from];
    const rateTo = data.rates[to];
    if (!rateFrom || !rateTo) return null;
    return rateTo / rateFrom;
  }, [from, to, data]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div
      className={`fixed top-1/2 right-0 z-40 flex -translate-y-1/2 transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Edge handle — always pokes out at the right edge */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close currency converter" : "Open currency converter"}
        aria-expanded={open}
        className="absolute right-full top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 rounded-l-xl bg-emerald-500 px-2 py-3 text-black shadow-lg shadow-black/30 hover:bg-emerald-400 transition-colors"
      >
        {open ? (
          <X className="w-4 h-4" />
        ) : (
          <>
            <Coins className="w-4 h-4" />
            <ChevronLeft className="w-3 h-3" />
          </>
        )}
      </button>

      {/* Panel */}
      <div className="w-[320px] max-w-[86vw] bg-[#1A1D26] border-l border-y border-[#322F36] rounded-l-2xl shadow-2xl shadow-black/40 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Currency Converter
              </h3>
              <p className="text-xs text-[#A0A0B0]">
                {data ? `Rates as of ${data.date}` : "Live travel rates"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh rates"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A0A0B0] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>

        {error ? (
          <div className="text-center py-6">
            <p className="text-sm text-[#A0A0B0] mb-3">{error}</p>
            <button
              type="button"
              onClick={load}
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={groupDigits(amount)}
                onChange={(e) => setAmount(toRawNumber(e.target.value))}
                placeholder="0"
                className="flex-1 min-w-0 rounded-xl border border-[#322F36] bg-[#322F36]/40 px-4 py-3 text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <CurrencySelect value={from} onChange={setFrom} options={options} />
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={swap}
                aria-label="Swap currencies"
                className="w-9 h-9 rounded-full border border-[#322F36] bg-[#322F36]/40 flex items-center justify-center text-[#A0A0B0] hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 min-w-0 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center">
                <span className="text-lg font-bold text-emerald-400 truncate">
                  {loading && !data
                    ? "…"
                    : result !== null
                      ? formatAmount(result)
                      : "—"}
                </span>
              </div>
              <CurrencySelect value={to} onChange={setTo} options={options} />
            </div>

            {unitRate !== null && (
              <p className="text-xs text-[#A0A0B0] text-center pt-1">
                1 {from} = {formatAmount(unitRate)} {to}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CurrencySelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { code: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-24 shrink-0 rounded-xl border border-[#322F36] bg-[#322F36]/40 px-3 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
    >
      {options.map((o) => (
        <option key={o.code} value={o.code} className="bg-[#1A1D26]">
          {o.code}
        </option>
      ))}
    </select>
  );
}
