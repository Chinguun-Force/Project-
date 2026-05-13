import { cn } from "@/lib/cn";

const pins = [
  {
    id: "ub",
    label: "Улаанбаатар",
    hint: "Даалгавар: кофе аялал",
    left: "18%",
    top: "24%",
    color: "from-amber-400 to-amber-500",
    ring: "ring-amber-200/80",
  },
  {
    id: "gobi",
    label: "Говь",
    hint: "Ойролцоох эвент",
    left: "72%",
    top: "36%",
    color: "from-sky-400 to-cyan-500",
    ring: "ring-sky-200/80",
  },
  {
    id: "tr",
    label: "Тэрэлж",
    hint: "Байгаль + үзэмж",
    left: "42%",
    top: "68%",
    color: "from-teal-400 to-emerald-500",
    ring: "ring-teal-200/80",
  },
] as const;

export function MockMapSection({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "game-panel-strong relative overflow-hidden rounded-3xl shadow-[0_16px_48px_rgba(28,36,41,0.08)]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 100% 85% at 50% 115%, rgba(20,90,85,0.12) 0%, transparent 55%), radial-gradient(circle at 25% 18%, rgba(56,189,248,0.18), transparent 42%), radial-gradient(circle at 78% 12%, rgba(251,191,36,0.14), transparent 38%), linear-gradient(168deg, #e8f4fc 0%, #eef6f3 38%, #f5f0e8 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="mapNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#mapNoise)" />
        </svg>
      </div>

      <div className="relative grid min-h-[240px] grid-cols-8 grid-rows-6 gap-0.5 p-3 sm:min-h-[300px]">
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm bg-white/40 ring-1 ring-stone-200/50"
          />
        ))}

        {pins.map((pin) => (
          <div
            key={pin.id}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: pin.left, top: pin.top }}
          >
            <button
              type="button"
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br shadow-md transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                pin.color,
                pin.ring,
                "ring-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-900/10",
              )}
              aria-label={pin.label}
            >
              <span className="text-sm font-bold text-white drop-shadow-sm">
                ?
              </span>
              <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-stone-700/25" />
            </button>
            <div
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-xl border border-stone-200/90 bg-white/95 px-3 py-2 text-left text-[11px] text-stone-700 opacity-0 shadow-lg shadow-stone-900/8 backdrop-blur-md transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "group-hover:pointer-events-auto group-hover:opacity-100",
              )}
            >
              <p className="font-semibold text-amber-900">{pin.label}</p>
              <p className="mt-0.5 text-stone-600">{pin.hint}</p>
            </div>
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-center">
          <div className="game-panel rounded-full px-4 py-1.5 text-[10px] font-medium text-stone-600">
            Зураг дээрх цэгүүд дээр хулганаа авч очоод мэдээлэл харна уу
          </div>
        </div>
      </div>

      <div className="relative border-t border-stone-200/80 bg-white/60 px-4 py-3 text-xs text-stone-600 backdrop-blur-md">
        <p className="font-semibold text-teal-800">Газрын зураг (демо)</p>
        <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
          Бодит газрын зураг болон GPS даалгавар дараагийн шатанд нэмэгдэнэ.
        </p>
      </div>
    </section>
  );
}
