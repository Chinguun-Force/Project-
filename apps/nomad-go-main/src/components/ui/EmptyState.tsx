import { cn } from "@/lib/cn";

export function EmptyState({
  icon = "🧭",
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300/90 bg-white/80 px-6 py-12 text-center shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <span className="text-3xl opacity-90">{icon}</span>
      <h3 className="mt-4 text-base font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
