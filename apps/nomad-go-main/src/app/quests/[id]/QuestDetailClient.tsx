"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getQuestRewardXp, type Quest } from "@/data/quests";
import { CelebrationModal } from "@/components/quests/CelebrationModal";
import { useToast } from "@/components/ui/ToastHost";
import { resolveQuestStatus } from "@/lib/quest-status";
import { useGameStore } from "@/store/useGameStore";
import type { QuestDifficulty, QuestStatus } from "@/types";
import { cn } from "@/lib/cn";

const difficultyRing: Record<QuestDifficulty, string> = {
  easy: "ring-emerald-400/50",
  medium: "ring-amber-400/50",
  hard: "ring-rose-400/50",
};

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

export function QuestDetailClient({ quest }: { quest: Quest }) {
  const router = useRouter();
  const toast = useToast();
  const user = useGameStore((s) => s.user);
  const startQuest = useGameStore((s) => s.startQuest);
  const completeQuest = useGameStore((s) => s.completeQuest);
  const rewardXp = useMemo(() => getQuestRewardXp(quest), [quest]);

  const status: QuestStatus = useMemo(
    () => resolveQuestStatus(quest, user.activeQuestIds, user.completedQuestIds),
    [quest, user.activeQuestIds, user.completedQuestIds],
  );

  const [celebrate, setCelebrate] = useState(false);
  const [photoMock, setPhotoMock] = useState(false);
  const [gpsMock, setGpsMock] = useState(false);
  const [pending, setPending] = useState(false);

  const handleStart = async () => {
    setPending(true);
    try {
      const message = await startQuest(quest.id);
      toast(message, "info");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Даалгавар эхлүүлэхэд алдаа гарлаа.",
        "info",
      );
    } finally {
      setPending(false);
    }
  };

  const handleComplete = async () => {
    if (status !== "in_progress") {
      toast("Эхлээд даалгавраа эхлүүлнэ үү.", "info");
      return;
    }
    if (!photoMock || !gpsMock) {
      toast("Нотлох баримт нэмнэ үү: Фото + GPS.", "info");
      return;
    }
    setPending(true);
    try {
      const message = await completeQuest(quest.id, {
        proofPhoto: photoMock,
        proofGps: gpsMock,
      });
      setCelebrate(true);
      toast(message, "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Даалгавар дуусгахад алдаа гарлаа.",
        "info",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="h-full space-y-8 overflow-y-auto px-4 py-6 pb-28 md:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 shadow-md">
        <div
          className={cn(
            "overflow-hidden rounded-2xl ring-2 ring-inset ring-offset-0",
            difficultyRing[quest.difficulty],
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={quest.image}
            alt=""
            className="h-48 w-full object-cover sm:h-64"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/75 via-stone-900/25 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85">
              {quest.location}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {quest.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full border border-stone-200/80 bg-white/90 px-3 py-1 text-stone-700 shadow-sm">
          Түвшин: {difficultyLabel[quest.difficulty]}
        </span>
        <span className="rounded-full border border-amber-200/90 bg-amber-50 px-3 py-1 font-semibold text-amber-900 shadow-sm">
          +{rewardXp} XP
        </span>
        <span className="rounded-full border border-stone-200/80 bg-stone-50 px-3 py-1 text-stone-600">
          {quest.duration}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 font-semibold shadow-sm ring-1 ring-inset ring-black/5",
            status === "completed" &&
              "border border-emerald-200/90 bg-emerald-50 text-emerald-900",
            status === "in_progress" &&
              "border border-teal-200/90 bg-teal-50 text-teal-900",
            status === "available" &&
              "border border-amber-200/90 bg-amber-50/80 text-amber-900",
          )}
        >
          {statusLabel[status]}
        </span>
      </div>

      <section className="sim-glass rounded-2xl border-stone-200/80 p-5">
        <h2 className="text-sm font-semibold text-stone-800">Тайлбар</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{quest.description}</p>
        <p className="mt-4 border-l-2 border-teal-300/80 pl-4 text-sm italic leading-relaxed text-stone-500">
          {quest.loreText}
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-800">Даалгаврын алхмууд</h2>
        <ol className="mt-4 space-y-3">
          {quest.steps.map((s, i) => (
            <li
              key={s.id}
              className="sim-glass flex gap-3 rounded-2xl border-stone-200/80 p-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200/80 bg-white text-xs font-semibold text-stone-700 shadow-sm">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-900">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{s.detail}</p>
              </div>
              <span className="shrink-0 self-start rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-900">
                +{s.xp ?? 0} XP
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sim-glass rounded-2xl border border-emerald-200/70 bg-emerald-50/30 p-5">
          <h3 className="text-sm font-semibold text-emerald-900">Шагнал</h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-800/90">
            {rewardXp} XP авч, профайл дээрээ нэмнэ. (Демо)
          </p>
        </div>
        <div className="sim-glass rounded-2xl border-stone-200/80 p-5">
          <h3 className="text-sm font-semibold text-stone-800">Нотлох баримт</h3>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">
            Одоогоор демо — зураг болон GPS-ийг асааж/унтраана.
          </p>
          <button
            type="button"
            onClick={() => setPhotoMock((v) => !v)}
            className={cn(
              "mt-3 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm text-stone-800 transition duration-300",
              photoMock
                ? "border-emerald-300 bg-emerald-50"
                : "border-dashed border-stone-300 bg-white/60 hover:border-emerald-300",
            )}
          >
            <span>📷 Зураг оруулах</span>
            <span className="text-xs font-medium text-stone-500">
              {photoMock ? "Бэлэн" : "Демо"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setGpsMock((v) => !v)}
            className={cn(
              "mt-2 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm text-stone-800 transition duration-300",
              gpsMock
                ? "border-teal-300 bg-teal-50"
                : "border-dashed border-stone-300 bg-white/60 hover:border-teal-300",
            )}
          >
            <span>📍 GPS шалгалт</span>
            <span className="text-xs font-medium text-stone-500">
              {gpsMock ? "Баталгаажсан" : "Демо"}
            </span>
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleStart}
          disabled={pending || status === "completed" || status === "in_progress"}
          className="flex-1 rounded-xl border border-stone-300/90 bg-white py-3 text-sm font-semibold text-stone-800 shadow-sm transition duration-500 enabled:hover:-translate-y-0.5 enabled:hover:border-teal-200 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status === "completed"
            ? "Дууссан"
            : status === "in_progress"
              ? "Идэвхтэй"
              : "Эхлүүлэх"}
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={pending || status === "completed"}
          className="flex-1 rounded-xl bg-gradient-to-b from-teal-600 to-teal-700 py-3 text-sm font-semibold text-white shadow-md transition duration-500 enabled:hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status === "completed" ? "Дууссан" : "Дуусгах"}
        </button>
      </div>

      <Link
        href="/quests"
        className="inline-flex text-sm font-medium text-teal-800 transition duration-300 hover:text-teal-950"
      >
        ← Буцах
      </Link>

      <CelebrationModal
        open={celebrate}
        title="🎉 Та даалгаврыг амжилттай биелүүллээ!"
        subtitle="XP нэмэгдэж, түвшний явц шинэчлэгдлээ."
        xpGained={rewardXp}
        onClose={() => {
          setCelebrate(false);
          router.push("/quests");
        }}
      />
    </div>
  );
}
