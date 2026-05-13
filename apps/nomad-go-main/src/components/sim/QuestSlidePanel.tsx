"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getQuestRewardXp, type Quest } from "@/data/quests";
import { cn } from "@/lib/cn";
import type { QuestDifficulty, QuestStatus } from "@/types";
import { useI18n } from "@/i18n/LanguageProvider";

const difficultyLabel: Record<QuestDifficulty, string> = {
  easy: "Хялбар",
  medium: "Дунд",
  hard: "Хэцүү",
};

const statusLabel: Record<QuestStatus, string> = {
  available: "Шинэ",
  in_progress: "Идэвхтэй",
  completed: "Дууссан",
};

export function QuestSlidePanel({
  open,
  quest,
  status,
  onClose,
}: {
  open: boolean;
  quest: Quest | null;
  status: QuestStatus | null;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!quest || status === null) return null;

  const reward = getQuestRewardXp(quest);

  return (
    <>
      <button
        type="button"
        aria-label={t("quest.panel.close")}
        className={cn(
          "fixed inset-0 z-[55] bg-stone-900/25 backdrop-blur-[3px] transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "sim-glass-strong fixed bottom-0 right-0 top-12 z-[60] flex w-full max-w-md flex-col border-l border-stone-200/80 shadow-2xl shadow-stone-900/10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:top-12",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-200/70 px-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-800/75">
              {quest.location}
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-snug text-stone-900">
              {quest.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200/80 bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm transition duration-300 hover:border-teal-200"
          >
            {t("quest.panel.close")}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="relative mb-4 aspect-video overflow-hidden rounded-xl border border-stone-200/70 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={quest.image}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/35 to-transparent" />
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-medium">
            <span className="rounded-lg border border-stone-200/80 bg-white/90 px-2 py-0.5 text-stone-700 shadow-sm">
              {difficultyLabel[quest.difficulty]}
            </span>
            <span className="rounded-lg border border-stone-200/80 bg-white/90 px-2 py-0.5 text-stone-700 shadow-sm">
              {statusLabel[status]}
            </span>
            <span className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-amber-900 shadow-sm">
              +{reward} XP
            </span>
            <span className="rounded-lg border border-stone-200/60 bg-stone-50/90 px-2 py-0.5 text-stone-600">
              {quest.duration}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-stone-600">{quest.description}</p>
        </div>

        <div className="border-t border-stone-200/70 bg-white/40 p-4">
          <Link
            href={`/quests/${quest.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-teal-600 to-teal-700 py-2.5 text-sm font-semibold text-white shadow-md transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-[1.03]"
            onClick={onClose}
          >
            {t("quest.panel.details")}
          </Link>
          <p className="mt-2 text-center text-[10px] text-stone-500">
            {t("quest.panel.hint")}
          </p>
        </div>
      </aside>
    </>
  );
}
