import { cn } from "@/lib/cn";

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: {
  icon: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group sim-glass relative overflow-hidden rounded-2xl border-stone-200/80 p-6 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1 hover:border-teal-200/80 hover:shadow-lg",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/50 via-transparent to-amber-50/30 opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200/70 bg-white/90 text-2xl shadow-sm">
        {icon}
      </div>
      <h3 className="relative mt-5 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-stone-600">{description}</p>
    </article>
  );
}
