import { cn } from "@/lib/cn";
import type { InventoryEntry } from "@/store/useGameStore";

export function BagItemCard({ entry }: { entry: InventoryEntry }) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm",
        "transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1 hover:border-teal-200/70 hover:shadow-md",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-sky-50/20 opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{entry.item.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">{entry.item.description}</p>
        </div>
        <span className="rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900">
          x{entry.quantity}
        </span>
      </div>
      <div className="relative mt-3 flex items-center justify-between text-xs text-stone-500">
        <span>{entry.item.priceXp} XP</span>
        <span>{new Date(entry.acquiredAt).toLocaleDateString("mn-MN")}</span>
      </div>
    </article>
  );
}
