"use client";

import { cn } from "@/lib/cn";
import type { ShopItem } from "@/store/useGameStore";

const rarityStyles: Record<string, string> = {
  common: "border-stone-200/90 bg-stone-50 text-stone-700",
  rare: "border-teal-200/90 bg-teal-50 text-teal-900",
  epic: "border-amber-200/90 bg-amber-50 text-amber-900",
};

const rarityLabels: Record<string, string> = {
  common: "Энгийн",
  rare: "Ховор",
  epic: "Онцгой",
};

export function ShopItemCard({
  item,
  xpBalance,
  pending,
  onBuy,
}: {
  item: ShopItem;
  xpBalance: number;
  pending: boolean;
  onBuy: (id: string) => void;
}) {
  const canBuy = xpBalance >= item.priceXp && !pending;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm",
        "transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1 hover:border-teal-200/80 hover:shadow-lg",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/40 via-transparent to-amber-50/30 opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{item.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">{item.description}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
            rarityStyles[item.rarity] ?? rarityStyles.common,
          )}
        >
          {rarityLabels[item.rarity] ?? "Энгийн"}
        </span>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-sm">
          {item.priceXp} XP
        </span>
        <button
          type="button"
          onClick={() => onBuy(item.id)}
          disabled={!canBuy}
          className="rounded-xl bg-gradient-to-b from-teal-600 to-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-md transition duration-500 enabled:hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "..." : canBuy ? "Авах" : "XP хүрэлцэхгүй"}
        </button>
      </div>
    </article>
  );
}
