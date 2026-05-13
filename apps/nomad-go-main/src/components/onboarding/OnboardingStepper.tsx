"use client";

import { cn } from "@/lib/cn";

export function OnboardingStepper({
  step,
  total,
  className,
}: {
  step: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={n} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition duration-500",
                done && "bg-teal-600 text-white shadow-sm",
                active &&
                  "bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-md ring-1 ring-amber-200/80",
                !done && !active && "border border-stone-200/90 bg-stone-50 text-stone-500",
              )}
            >
              {done ? "✓" : n}
            </div>
            {n < total ? (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full transition duration-500",
                  done ? "bg-teal-300/90" : "bg-stone-200/90",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
