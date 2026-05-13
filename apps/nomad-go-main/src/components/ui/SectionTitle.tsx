import { cn } from "@/lib/cn";

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800/70">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl sm:leading-snug">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 max-w-xl text-base leading-relaxed text-stone-600">{subtitle}</p>
      ) : null}
    </div>
  );
}
