"use client";

import { getXpProgress, getNextLevelThreshold } from "@/lib/xp";
import { cn } from "@/lib/cn";

export function XPProgressBar({
  xp,
  className,
}: {
  xp: number;
  className?: string;
}) {
  const { level, percent } = getXpProgress(xp);
  const next = getNextLevelThreshold(xp);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
        <span>
          Түвшин <span className="font-mono text-teal-700">{level}</span>
          <span className="text-stone-400"> · </span>
          <span className="font-mono text-stone-500">{xp} XP</span>
        </span>
        <span className="text-stone-500">Дараагийнх · {next} XP</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-stone-200/90 ring-1 ring-stone-200/80">
        <div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${percent}%` }}
        >
          <span className="xp-bar-shine" />
        </div>
      </div>
    </div>
  );
}
