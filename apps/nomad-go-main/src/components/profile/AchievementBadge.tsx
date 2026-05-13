import type { AchievementDef } from "@/lib/achievements";
import { cn } from "@/lib/cn";

export function AchievementBadge({
  achievement,
  unlocked,
}: {
  achievement: AchievementDef;
  unlocked: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        unlocked
          ? "border-teal-200/90 bg-white/95 shadow-sm hover:border-teal-300/90 hover:shadow-md"
          : "border-dashed border-stone-200/90 bg-stone-50/60 opacity-70",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-2xl",
          unlocked
            ? "border-stone-200/90 bg-gradient-to-br from-sky-50 to-teal-50/80"
            : "border-stone-200/70 bg-stone-100/80 grayscale",
        )}
      >
        {achievement.icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-stone-900">
          {achievement.title}
          {!unlocked ? (
            <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-stone-500">
              Түгжээтэй
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">{achievement.description}</p>
      </div>
    </div>
  );
}
