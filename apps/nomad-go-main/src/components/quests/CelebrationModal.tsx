"use client";

import { cn } from "@/lib/cn";

export function CelebrationModal({
  open,
  title,
  subtitle,
  xpGained,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  xpGained: number;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-900/30 p-4 pb-28 backdrop-blur-sm sm:items-center sm:pb-4">
      <div
        className={cn(
          "w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 p-8 text-center shadow-2xl shadow-stone-900/10",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
      >
        <div className="pointer-events-none text-4xl">🎉</div>
        <h2
          id="celebration-title"
          className="mt-4 text-xl font-bold tracking-tight text-stone-900"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{subtitle}</p>
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-2.5 text-sm font-medium text-amber-950 shadow-sm">
          <span>+{xpGained} XP</span>
          <span className="text-amber-800/50">·</span>
          <span>Түвшний явц шинэчлэгдлээ</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-xl bg-gradient-to-b from-teal-600 to-teal-700 py-3 text-sm font-semibold text-white shadow-md transition duration-500 hover:brightness-[1.03]"
        >
          Үргэлжлүүлэх
        </button>
      </div>
    </div>
  );
}
