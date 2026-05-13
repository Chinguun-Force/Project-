"use client";

import { cn } from "@/lib/cn";

const cards = [
  { label: "Даалгавар", sub: "Кофе аялал · Улаанбаатар", tone: "from-sky-50 to-teal-50/80" },
  { label: "XP +45", sub: "Түвшин 3 руу ойртож байна", tone: "from-amber-50/90 to-orange-50/60" },
  { label: "Судлах", sub: "Газрын зураг дээрх тэмдэг", tone: "from-stone-50 to-emerald-50/80" },
] as const;

export function HeroPreviewStack({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[280px]", className)}>
      <div className="pointer-events-none absolute -inset-6 rounded-full bg-sky-200/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-white/40 to-amber-100/20 blur-xl" aria-hidden />
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={cn(
            "relative rounded-2xl border border-stone-200/70 bg-gradient-to-br p-4 shadow-md transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "hover:-translate-y-1 hover:shadow-lg",
            c.tone,
            i === 0 && "z-30 rotate-[-2deg]",
            i === 1 && "z-20 -mt-8 ml-4 mr-0 rotate-[1.5deg]",
            i === 2 && "z-10 -mt-8 ml-1 rotate-[-0.5deg]",
          )}
          style={{ transitionDelay: `${i * 40}ms` }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            {c.label}
          </p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-stone-800">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
