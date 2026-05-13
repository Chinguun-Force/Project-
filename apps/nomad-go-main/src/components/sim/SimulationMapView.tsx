"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import type { Quest } from "@/data/quests";
import type { QuestStatus } from "@/types";
import { getQuestMapPosition } from "@/data/quest-map-positions";
import { useI18n } from "@/i18n/LanguageProvider";

/** Watercolor / atlas style base — `travel-atlas-map.png` (та өөрийн зурагаар солино). */
const MAP_TEXTURE_SRC = "/map/travel-atlas-map.png";

const statusPinStyle: Record<QuestStatus, string> = {
  available:
    "bg-amber-300 shadow-sm ring-2 ring-white/95 ring-offset-2 ring-offset-sky-900/10",
  in_progress:
    "bg-sky-400 shadow-sm ring-2 ring-white/95 ring-offset-2 ring-offset-sky-900/10",
  completed:
    "bg-emerald-400 shadow-sm ring-2 ring-white/90 ring-offset-2 ring-offset-sky-900/10",
};

function DecorativeCompass({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none opacity-[0.92] drop-shadow-md",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 80 80" className="h-14 w-14 md:h-16 md:w-16" fill="none">
        <circle cx="40" cy="40" r="36" fill="url(#cmpBg)" stroke="#5c4033" strokeWidth="1.2" />
        <path
          d="M40 8 L44 32 L40 28 L36 32 Z"
          fill="#c4a574"
          stroke="#5c4033"
          strokeWidth="0.6"
        />
        <path
          d="M40 72 L36 48 L40 52 L44 48 Z"
          fill="#8b7355"
          stroke="#5c4033"
          strokeWidth="0.6"
        />
        <path
          d="M8 40 L32 36 L28 40 L32 44 Z"
          fill="#a89070"
          stroke="#5c4033"
          strokeWidth="0.6"
        />
        <path
          d="M72 40 L48 44 L52 40 L48 36 Z"
          fill="#a89070"
          stroke="#5c4033"
          strokeWidth="0.6"
        />
        <text
          x="40"
          y="17"
          textAnchor="middle"
          className="fill-[#3d2914] text-[8px] font-serif font-bold"
        >
          N
        </text>
        <circle cx="40" cy="40" r="4" fill="#3d2914" opacity="0.85" />
        <defs>
          <radialGradient id="cmpBg" cx="35%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#f5e6d3" />
            <stop offset="55%" stopColor="#e8d4bc" />
            <stop offset="100%" stopColor="#d4c4a8" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export function SimulationMapView({
  markers,
  selectedId,
  onSelect,
  className,
}: {
  markers: { quest: Quest; status: QuestStatus }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const sorted = useMemo(
    () => [...markers].sort((a, b) => a.quest.id.localeCompare(b.quest.id)),
    [markers],
  );

  return (
    <div
      className={cn(
        "relative h-full min-h-[280px] w-full overflow-hidden rounded-none shadow-md md:rounded-xl",
        className,
      )}
    >
      <div className="absolute inset-0 bg-sky-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MAP_TEXTURE_SRC}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>
      {/* Soft lift: тэнгисийн өнгийг зөөлөн, UI-тай зохицуулна */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/15 via-transparent to-sky-50/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background: `
            radial-gradient(ellipse 50% 38% at 8% 12%, rgba(255,255,255,0.85) 0%, transparent 50%),
            radial-gradient(ellipse 48% 40% at 92% 10%, rgba(255,255,255,0.8) 0%, transparent 48%),
            radial-gradient(ellipse 55% 45% at 50% 100%, rgba(255,255,255,0.5) 0%, transparent 50%)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <DecorativeCompass className="absolute left-2 top-2 z-[6] md:left-3 md:top-3" />

      {sorted.map(({ quest, status }) => {
        const pos = getQuestMapPosition(quest.id);
        const active = selectedId === quest.id;
        return (
          <div
            key={quest.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.left, top: pos.top }}
          >
            <button
              type="button"
              onClick={() => onSelect(active ? null : quest.id)}
              className={cn(
                "group relative flex h-4 w-4 items-center justify-center rounded-full transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                statusPinStyle[status],
                active && "scale-125",
                "hover:scale-125 hover:brightness-[1.04]",
              )}
              aria-label={quest.title}
              aria-pressed={active}
            >
              <span className="sr-only">{quest.title}</span>
            </button>
            <div
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-[min(240px,70vw)] -translate-x-1/2 rounded-lg border border-stone-200/80 bg-white/95 px-2.5 py-1.5 text-left text-[11px] text-stone-800 opacity-0 shadow-lg backdrop-blur-sm transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "group-hover:opacity-100 group-focus-within:opacity-100",
              )}
            >
              <p className="font-semibold leading-snug text-stone-900">{quest.title}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-stone-600">{quest.location}</p>
            </div>
          </div>
        );
      })}

      <div className="pointer-events-none absolute left-3 top-[3.25rem] z-[7] max-w-[min(220px,85%)] rounded-lg border border-white/70 bg-white/90 px-2.5 py-1.5 text-[10px] font-medium leading-snug text-stone-700 shadow-md backdrop-blur-sm md:top-14">
        <span className="font-semibold uppercase tracking-wide text-teal-800/75">
          {t("quest.map.title")}
        </span>
        <span className="text-stone-500"> · {t("quest.map.demo")}</span>
      </div>
    </div>
  );
}
