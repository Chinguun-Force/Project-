"use client";

import { AchievementBadge } from "@/components/profile/AchievementBadge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ACHIEVEMENTS, computeUnlockedAchievements } from "@/lib/achievements";
import { getQuestIndex } from "@/store/useGameStore";
import { useGameStore } from "@/store/useGameStore";

export function AchievementsClient() {
  const user = useGameStore((s) => s.user);
  const questsById = getQuestIndex();
  const unlocked = computeUnlockedAchievements({
    xp: user.xp,
    completedQuestIds: user.completedQuestIds,
    questsById,
  });
  const unlockedSet = new Set(unlocked);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-4 pb-16 md:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          Симулятор
        </p>
        <h1 className="sim-heading mt-2 text-2xl font-bold tracking-tight">Амжилт</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Даалгавар болон XP-ээр нээгддэг амжилтын жагсаалт.
        </p>
      </div>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Төлөв"
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
    </div>
  );
}
