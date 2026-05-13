"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getQuestById } from "@/data/quests";
import { getXpProgress } from "@/lib/xp";
import { useGameStore } from "@/store/useGameStore";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useI18n } from "@/i18n/LanguageProvider";

export function SimTopHud() {
  const user = useGameStore((s) => s.user);
  const { t } = useI18n();
  const { level, percent } = getXpProgress(user.xp);

  const locationLabel = useMemo(() => {
    const first = user.activeQuestIds[0];
    if (!first) return t("top.location.empty");
    const q = getQuestById(first);
    return q?.location ?? "—";
  }, [t, user.activeQuestIds]);

  const activeCount = user.activeQuestIds.length;

  return (
    <header className="sim-glass-strong sticky top-0 z-[42] flex h-12 items-center gap-3 border-b border-stone-200/70 px-3 pl-14 shadow-sm backdrop-blur-xl md:pl-52 md:pr-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-[11px] md:text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-medium uppercase tracking-wide text-stone-500">
            {t("top.level")}
          </span>
          <span className="rounded-lg border border-stone-200/80 bg-white/90 px-1.5 py-0.5 font-mono font-semibold tabular-nums text-stone-800 shadow-sm">
            {level}
          </span>
        </div>
        <div className="hidden h-3 w-px bg-stone-200 sm:block" />
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-medium uppercase tracking-wide text-stone-500">
            XP
          </span>
          <span className="font-mono font-semibold tabular-nums text-teal-800">
            {user.xp}
          </span>
          <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-stone-200 sm:block md:w-24">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="hidden h-3 w-px bg-stone-200 md:block" />
        <div className="flex items-center gap-1.5">
          <span className="font-medium uppercase tracking-wide text-stone-500">
            {t("top.active")}
          </span>
          <span className="font-mono font-semibold text-stone-800">{activeCount}</span>
        </div>
        <div className="hidden h-3 w-px bg-stone-200 lg:block" />
        <div className="hidden min-w-0 max-w-[200px] truncate lg:block" title={locationLabel}>
          <span className="font-medium uppercase tracking-wide text-stone-500">
            {t("top.location")}
          </span>{" "}
          <span className="text-stone-700">{locationLabel}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <LanguageToggle />
        <Link
          href="/shop"
          className="rounded-lg border border-stone-200/80 bg-white/80 px-2 py-1 text-[10px] font-medium text-stone-700 shadow-sm transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-teal-200 hover:shadow md:text-xs"
        >
          {t("top.shop")}
        </Link>
        <Link
          href="/bag"
          className="rounded-lg border border-stone-200/80 bg-white/80 px-2 py-1 text-[10px] font-medium text-stone-700 shadow-sm transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-teal-200 hover:shadow md:text-xs"
        >
          {t("top.bag")}
        </Link>
      </div>
    </header>
  );
}
