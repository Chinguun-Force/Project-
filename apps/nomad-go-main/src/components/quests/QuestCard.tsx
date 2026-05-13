import Link from "next/link";
import { getQuestRewardXp, type Quest } from "@/data/quests";
import type { QuestCategory, QuestDifficulty, QuestStatus } from "@/types";
import { cn } from "@/lib/cn";

const difficultyStyles: Record<
  QuestDifficulty,
  string
> = {
  easy:
    "border-emerald-200/90 bg-emerald-50/95 text-emerald-900 shadow-sm",
  medium:
    "border-amber-200/90 bg-amber-50/95 text-amber-900 shadow-sm",
  hard: "border-rose-200/90 bg-rose-50/95 text-rose-900 shadow-sm",
};

const statusStyles: Record<QuestStatus, string> = {
  available:
    "border-amber-200/90 bg-amber-50/95 text-amber-950 shadow-sm ring-1 ring-amber-100/80",
  in_progress:
    "border-sky-200/90 bg-sky-50/95 text-sky-950 shadow-sm ring-1 ring-sky-100/80",
  completed:
    "border-teal-200/90 bg-teal-50/95 text-teal-950 shadow-sm ring-1 ring-teal-100/80",
};

const statusLabel: Record<QuestStatus, string> = {
  available: "Шинэ",
  in_progress: "Идэвхтэй",
  completed: "Дууссан",
};

const categoryLabel: Record<QuestCategory, string> = {
  food: "Хоол",
  culture: "Соёл",
  nature: "Байгаль",
  challenge: "Сорилт",
};

const categoryIcon: Record<QuestCategory, string> = {
  food: "🍜",
  culture: "🏛️",
  nature: "⛰️",
  challenge: "⚡",
};

const difficultyLabel: Record<QuestDifficulty, string> = {
  easy: "Хялбар",
  medium: "Дунд",
  hard: "Хэцүү",
};

function statusProgress(status: QuestStatus): number {
  if (status === "available") return 8;
  if (status === "in_progress") return 52;
  return 100;
}

export function QuestCard({
  quest,
  status,
}: {
  quest: Quest;
  status: QuestStatus;
}) {
  const rewardXp = getQuestRewardXp(quest);
  const progress = statusProgress(status);

  return (
    <Link
      href={`/quests/${quest.id}`}
      className="group block [perspective:1200px]"
    >
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95",
          "shadow-[0_8px_32px_rgba(28,36,41,0.08)]",
          "transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:-translate-y-1 hover:border-teal-200/80 hover:shadow-[0_16px_40px_rgba(20,90,85,0.12)]",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-500/[0.06] via-transparent to-sky-500/[0.05] opacity-0 transition duration-500 group-hover:opacity-100" />

        <div className="relative h-36 overflow-hidden sm:h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={quest.image}
            alt=""
            className="h-full w-full object-cover transition duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/75 via-stone-900/35 to-sky-900/15" />

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/20 text-xl backdrop-blur-md">
              {categoryIcon[quest.category]}
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-100/95">
                {categoryLabel[quest.category]}
              </p>
              <p className="text-[10px] text-white/70">Цуглуулдаг карт</p>
            </div>
          </div>

          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md",
                difficultyStyles[quest.difficulty],
              )}
            >
              {difficultyLabel[quest.difficulty]}
            </span>
            <span className="rounded-full border border-amber-200/90 bg-amber-50/95 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow-sm">
              +{rewardXp} XP
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md",
                statusStyles[status],
              )}
            >
              {statusLabel[status]}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/20 ring-1 ring-white/25 backdrop-blur-sm">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 via-amber-300 to-sky-400 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow-sm">
              {quest.title}
            </h3>
          </div>
        </div>

        <div className="space-y-3 border-t border-stone-100/90 p-4">
          <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">{quest.description}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200/90 bg-stone-50/90 px-2 py-0.5 text-stone-700">
              📍 {quest.location}
            </span>
            <span>{quest.duration}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
