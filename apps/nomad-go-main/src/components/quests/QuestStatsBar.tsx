"use client";

import { useMemo } from "react";
import { useGameStore } from "@/store/useGameStore";
import { getNextLevelThreshold, getXpProgress } from "@/lib/xp";
import { useI18n } from "@/i18n/LanguageProvider";

export function QuestStatsBar() {
  const user = useGameStore((s) => s.user);
  const { t } = useI18n();
  const { level, percent } = getXpProgress(user.xp);
  const nextAt = getNextLevelThreshold(user.xp);

  const activeCount = useMemo(
    () => user.activeQuestIds.length,
    [user.activeQuestIds.length],
  );

  return (
    <section className="sim-glass relative rounded-2xl border-stone-200/80 p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            {t("top.level")}
          </p>
          <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-stone-900">
            {level}
          </p>
          <p className="text-[10px] text-stone-500">
            {t("quest.stats.next")} · {nextAt} XP
          </p>
        </div>
        <div className="hidden h-8 w-px bg-stone-200 sm:block" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-stone-500">
            <span>XP</span>
            <span className="font-mono tabular-nums text-stone-700">
              {user.xp} · {percent}%
            </span>
          </div>
          <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-stone-200/90 ring-1 ring-stone-200/80">
            <div
              className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            >
              <span className="xp-bar-shine" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-4 border-t border-stone-200/70 pt-3 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            {t("quest.stats.totalXp")}
          </p>
          <p className="mt-0.5 font-mono text-base font-semibold tabular-nums text-stone-800">
            {user.xp}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            {t("top.active")}
          </p>
          <p className="mt-0.5 font-mono text-base font-semibold tabular-nums text-teal-800">
            {activeCount}
          </p>
        </div>
      </div>
    </section>
  );
}
