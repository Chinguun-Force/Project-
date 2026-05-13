"use client";

import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-stone-200/80 bg-white/85 p-1 shadow-sm backdrop-blur-sm",
        className,
      )}
      aria-label="Language switch"
    >
      {(["mn", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLang(item)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
            lang === item
              ? "bg-teal-600 text-white"
              : "text-stone-600 hover:bg-stone-100",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

