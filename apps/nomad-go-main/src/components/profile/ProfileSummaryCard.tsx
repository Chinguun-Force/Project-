"use client";

import { AVATAR_OPTIONS, TRAVELER_LABELS, type TravelerType } from "@/types";
import { XPProgressBar } from "@/components/profile/XPProgressBar";
import { getLevelFromXp } from "@/lib/xp";
import { cn } from "@/lib/cn";

export function ProfileSummaryCard({
  name,
  avatarId,
  travelerType,
  xp,
  className,
}: {
  name: string;
  avatarId: string;
  travelerType: TravelerType;
  xp: number;
  className?: string;
}) {
  const avatar = AVATAR_OPTIONS.find((a) => a.id === avatarId);
  const level = getLevelFromXp(xp);

  return (
    <section
      className={cn(
        "sim-glass-strong relative overflow-hidden rounded-2xl p-5",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/50 via-transparent to-amber-50/40" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex shrink-0">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-200/90 bg-gradient-to-br from-stone-50 to-white text-4xl shadow-sm">
              {avatar?.emoji ?? "🧭"}
            </div>
            <div
              className="absolute -bottom-1 -right-1 z-10 flex min-h-[2.875rem] min-w-[2.875rem] flex-col items-center justify-center gap-0.5 rounded-full border border-amber-300/70 bg-[#fefcf6] px-2 py-1.5 text-center shadow-md shadow-stone-900/8 ring-1 ring-amber-100/90"
              title={`Түвшин ${level}`}
            >
              <span className="text-[10px] font-bold leading-none tracking-tight text-amber-950">
                Түв
              </span>
              <span className="text-base font-bold leading-none tabular-nums text-amber-950">
                {level}
              </span>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-stone-900">{name}</p>
            <p className="text-sm text-stone-600">{TRAVELER_LABELS[travelerType]}</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              Профайл
            </p>
          </div>
        </div>
        <div className="flex-1">
          <XPProgressBar xp={xp} />
        </div>
      </div>
    </section>
  );
}
