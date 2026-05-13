"use client";

import type { QuestCategory } from "@/types";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/LanguageProvider";

export type StatusFilter = "all" | "available" | "in_progress" | "completed";

const statusTabs: { id: StatusFilter; labelKey: string }[] = [
  { id: "all", labelKey: "quest.filter.all" },
  { id: "available", labelKey: "quest.filter.new" },
  { id: "in_progress", labelKey: "quest.filter.active" },
  { id: "completed", labelKey: "quest.filter.done" },
];

const chips: { id: QuestCategory | "all"; labelKey: string }[] = [
  { id: "all", labelKey: "quest.filter.all" },
  { id: "food", labelKey: "quest.category.food" },
  { id: "culture", labelKey: "quest.category.culture" },
  { id: "nature", labelKey: "quest.category.nature" },
  { id: "challenge", labelKey: "quest.category.challenge" },
];

export function QuestFilterBar({
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  search,
  onSearchChange,
}: {
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  categoryFilter: QuestCategory | "all";
  onCategoryChange: (c: QuestCategory | "all") => void;
  search: string;
  onSearchChange: (q: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">{t("quest.search.placeholder")}</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("quest.search.placeholder")}
          className="w-full rounded-xl border border-stone-200/90 bg-white/90 px-3 py-2.5 text-sm text-stone-800 shadow-sm outline-none ring-0 transition duration-300 placeholder:text-stone-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-200/60"
        />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onStatusChange(tab.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              statusFilter === tab.id
                ? "border border-teal-200/90 bg-teal-50 text-teal-900 shadow-sm"
                : "border border-stone-200/70 bg-white/70 text-stone-600 hover:border-stone-300 hover:bg-white",
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategoryChange(c.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              categoryFilter === c.id
                ? "border-teal-200/90 bg-teal-50/90 text-teal-900 shadow-sm"
                : "border-stone-200/70 bg-white/60 text-stone-600 hover:border-stone-300",
            )}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
