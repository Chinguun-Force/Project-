"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { useToast } from "@/components/ui/ToastHost";
import { useGameStore } from "@/store/useGameStore";
import {
  AVATAR_OPTIONS,
  TRAVELER_LABELS,
  type TravelerType,
} from "@/types";
import { cn } from "@/lib/cn";

const styles: { id: TravelerType; copy: string }[] = [
  {
    id: "explorer",
    copy: "Шинэ өнцөг, үзэмж, нар мандах мөчийг хайж явдаг.",
  },
  {
    id: "food-hunter",
    copy: "Нууц амт, халуун хоол, шинэ газар — амтны эрэлд дуртай.",
  },
  {
    id: "culture-seeker",
    copy: "Хийд, музей, түүх домог — соёлыг мэдрэхийг хүсдэг.",
  },
  {
    id: "adventure-rider",
    copy: "Адал явдал, зам харгуй, сорилт — хүчтэй аялалд дуртай.",
  },
];

export function OnboardingClient() {
  const router = useRouter();
  const toast = useToast();
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [travelerType, setTravelerType] = useState<TravelerType>("explorer");
  const [avatarId, setAvatarId] = useState<string>("steppe");
  const [name, setName] = useState("");

  const canContinueStep1 = true;
  const canContinueStep2 = Boolean(avatarId);
  const canStart = name.trim().length >= 2;
  const START_TIMEOUT_MS = 12000;

  const startDemo = async () => {
    setSaving(true);
    try {
      await Promise.race([
        completeOnboarding({
          name: name.trim(),
          avatarId,
          travelerType,
        }),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Сервер удааширч байна. Дахин оролдоно уу.",
                ),
              ),
            START_TIMEOUT_MS,
          ),
        ),
      ]);
      router.replace("/quests");
      router.refresh();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Эхлүүлэхэд алдаа гарлаа. Дахин оролдоно уу.",
        "info",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-16 pt-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700/90">
          Эхлэх
        </p>
        <h1 className="game-title-gradient mt-2 text-2xl font-bold tracking-tight">
          Аяллын төрлөө сонго
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Бүртгэл шаардлагагүй. Энэ демо таны төхөөрөмж дээр хадгалагдана.
        </p>
      </div>

      <OnboardingStepper step={step} total={3} />

      {step === 1 ? (
        <section className="game-panel-strong space-y-4 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-stone-900">Сонголт</h2>
          <div className="grid gap-3">
            {styles.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTravelerType(s.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  travelerType === s.id
                    ? "border-teal-300/90 bg-gradient-to-r from-teal-50/95 to-sky-50/90 shadow-md ring-1 ring-teal-100/80"
                    : "game-panel border-transparent hover:border-stone-200/90",
                )}
              >
                <p className="font-medium text-stone-900">{TRAVELER_LABELS[s.id]}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{s.copy}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!canContinueStep1}
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-gradient-to-b from-teal-600 to-teal-700 py-3 text-sm font-semibold text-white shadow-md transition duration-500 enabled:hover:brightness-[1.03]"
          >
            Үргэлжлүүлэх
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="game-panel-strong space-y-4 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-stone-900">Дүр сонгох</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAvatarId(a.id)}
                className={cn(
                  "rounded-2xl border p-4 text-center transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  avatarId === a.id
                    ? "border-sky-300/90 bg-sky-50/95 shadow-md ring-1 ring-sky-100/80"
                    : "game-panel border-transparent hover:border-stone-200/90",
                )}
              >
                <span className="text-3xl">{a.emoji}</span>
                <p className="mt-2 text-xs font-medium text-stone-800">{a.label}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="game-panel flex-1 rounded-xl border border-stone-200/90 py-3 text-sm font-semibold text-stone-800 transition duration-500 hover:bg-stone-50/80"
            >
              Буцах
            </button>
            <button
              type="button"
              disabled={!canContinueStep2}
              onClick={() => setStep(3)}
              className="flex-1 rounded-xl bg-gradient-to-b from-teal-600 to-teal-700 py-3 text-sm font-semibold text-white shadow-md transition duration-500 enabled:hover:brightness-[1.03] disabled:opacity-40"
            >
              Үргэлжлүүлэх
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="game-panel-strong space-y-4 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-stone-900">Нэр оруулах</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Жишээ: Нараа"
            className="w-full rounded-xl border border-stone-200/90 bg-white/95 px-4 py-3 text-sm text-stone-900 outline-none ring-0 placeholder:text-stone-400 focus:border-teal-300/90 focus:ring-2 focus:ring-teal-200/60"
          />
          <p className="text-xs text-stone-500">
            Хамгийн багадаа 2 тэмдэгт. (Демо өгөгдөл)
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="game-panel sm:flex-1 rounded-xl border border-stone-200/90 py-3 text-sm font-semibold text-stone-800 transition duration-500 hover:bg-stone-50/80"
            >
              Буцах
            </button>
            <button
              type="button"
              disabled={saving || !canStart}
              onClick={startDemo}
              className="sm:flex-1 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 py-3 text-sm font-semibold text-amber-950 shadow-md transition duration-500 enabled:hover:brightness-[1.03] disabled:opacity-40 disabled:shadow-none"
            >
              {saving ? "Түр хүлээнэ үү..." : "Эхлэх"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
