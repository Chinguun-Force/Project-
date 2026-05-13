"use client";

import Link from "next/link";
import { useState } from "react";
import { AchievementBadge } from "@/components/profile/AchievementBadge";
import { ProfileSummaryCard } from "@/components/profile/ProfileSummaryCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useToast } from "@/components/ui/ToastHost";
import { MOCK_QUESTS, getQuestById, getQuestRewardXp } from "@/data/quests";
import {
  ACHIEVEMENTS,
  computeUnlockedAchievements,
} from "@/lib/achievements";
import { getQuestIndex } from "@/store/useGameStore";
import { useGameStore } from "@/store/useGameStore";
import { getLevelFromXp, getNextLevelThreshold } from "@/lib/xp";
import { TRAVELER_LABELS } from "@/types";

export default function ProfilePage() {
  const user = useGameStore((s) => s.user);
  const wallet = useGameStore((s) => s.wallet);
  const ledgerPreview = useGameStore((s) => s.ledgerPreview);
  const resetDemo = useGameStore((s) => s.resetDemo);
  const toast = useToast();
  const [resetting, setResetting] = useState(false);
  const level = getLevelFromXp(user.xp);
  const nextAt = getNextLevelThreshold(user.xp);

  const questsById = getQuestIndex();
  const unlocked = computeUnlockedAchievements({
    xp: user.xp,
    completedQuestIds: user.completedQuestIds,
    questsById,
  });
  const unlockedSet = new Set(unlocked);

  const completedQuests = user.completedQuestIds
    .map((id) => getQuestById(id))
    .filter(Boolean);

  const placesVisited = 3 + user.completedQuestIds.length * 2;

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      toast("Демо төлөв дахин эхэллээ.", "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Демог дахин эхлүүлэхэд алдаа гарлаа.",
        "info",
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto min-h-full max-w-3xl space-y-10 px-4 py-4 pb-16 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
            Профайл
          </p>
          <h1 className="sim-heading mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Миний профайл
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
            Таны XP, даалгавар, дэлгүүрийн худалдан авалт бүгд серверт бүртгэгдэнэ.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="rounded-xl border border-stone-200/90 bg-white/80 px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition duration-500 hover:border-amber-200/90 hover:bg-amber-50/80 disabled:opacity-50"
        >
          {resetting ? "Шинэчилж байна..." : "Демог дахин эхлүүлэх"}
        </button>
      </div>

      <ProfileSummaryCard
        name={user.name}
        avatarId={user.avatarId}
        travelerType={user.travelerType}
        xp={user.xp}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Биелүүлсэн даалгавар",
            value: user.completedQuestIds.length,
          },
          { label: "Очсон газрууд", value: placesVisited },
          { label: "XP үлдэгдэл", value: wallet.xpBalance },
        ].map((s) => (
          <div key={s.label} className="game-panel rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              {s.label}
            </p>
            <p className="mt-2 bg-gradient-to-r from-teal-700 via-teal-600 to-sky-600 bg-clip-text text-2xl font-bold tabular-nums text-transparent">
              {s.value}
            </p>
          </div>
        ))}
      </section>

      <section className="game-panel rounded-2xl border border-dashed border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white/60 to-teal-50/50 p-5">
        <p className="text-sm font-semibold text-stone-900">Дараагийн түвшний босго</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Таны түвшин: <span className="font-semibold text-amber-800">{level}</span>.
          Дараагийн түвшин{" "}
          <span className="font-semibold text-teal-700">{nextAt} XP</span> дээр нээгдэнэ. (0 ·
          100 · 250 · 450…)
        </p>
      </section>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Амжилтууд"
          title="Амжилтын сүлжээ"
          subtitle="Даалгавар дуусах бүрт автоматаар шинэчлэгдэнэ."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge
              key={a.id}
              achievement={a}
              unlocked={unlockedSet.has(a.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Дууссан даалгаврууд" />
        {completedQuests.length === 0 ? (
          <p className="game-panel rounded-2xl p-6 text-sm leading-relaxed text-stone-600">
            Одоогоор дууссан даалгавар алга.{" "}
            <Link href="/quests" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
              Даалгавар
            </Link>{" "}
            руу орж нэгийг дуусгаарай.
          </p>
        ) : (
          <ul className="space-y-3">
            {completedQuests.map((q) =>
              q ? (
                <li
                  key={q.id}
                  className="game-panel flex items-center justify-between rounded-2xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{q.title}</p>
                    <p className="text-xs text-stone-500">{q.location}</p>
                  </div>
                  <span className="text-xs font-semibold text-teal-700">
                    +{getQuestRewardXp(q)} XP
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </section>

      <section className="game-panel rounded-2xl p-4 text-xs text-stone-600">
        <p>
          Демо: {MOCK_QUESTS.length} даалгавар · төрөл{" "}
          <span className="font-semibold text-stone-800">
            {TRAVELER_LABELS[user.travelerType]}
          </span>
          .
        </p>
      </section>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="XP бүртгэл"
          title="Сүүлийн гүйлгээнүүд"
          subtitle="Даалгавар дуусгах болон дэлгүүрийн худалдан авалт энд түүх болон үлдэнэ."
        />
        {ledgerPreview.length === 0 ? (
          <p className="game-panel rounded-2xl p-4 text-sm text-stone-600">
            Одоогоор XP гүйлгээ алга.
          </p>
        ) : (
          <ul className="space-y-2">
            {ledgerPreview.map((entry) => (
              <li
                key={entry.id}
                className="game-panel flex items-center justify-between rounded-xl px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {entry.note ?? entry.sourceType}
                  </p>
                  <p className="text-xs text-stone-500">
                    {new Date(entry.createdAt).toLocaleString("mn-MN")}
                  </p>
                </div>
                <span
                  className={
                    entry.delta >= 0
                      ? "font-semibold text-teal-700"
                      : "font-semibold text-rose-600"
                  }
                >
                  {entry.delta >= 0 ? `+${entry.delta}` : entry.delta} XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/shop"
          className="game-panel rounded-2xl px-4 py-3 text-sm font-semibold text-stone-900 transition duration-500 hover:border-amber-200/90 hover:shadow-md"
        >
          XP дэлгүүр рүү орох
        </Link>
        <Link
          href="/bag"
          className="game-panel rounded-2xl px-4 py-3 text-sm font-semibold text-stone-900 transition duration-500 hover:border-teal-200/90 hover:shadow-md"
        >
          Миний цүнх харах
        </Link>
      </section>
    </div>
  );
}
