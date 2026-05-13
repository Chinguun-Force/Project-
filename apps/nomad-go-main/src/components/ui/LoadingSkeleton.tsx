import { cn } from "@/lib/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-stone-100 via-stone-200/80 to-stone-100 ring-1 ring-stone-200/70",
        className,
      )}
      aria-hidden
    />
  );
}
