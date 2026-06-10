"use client";

import { ShagaiIcon } from "@/components/ShagaiIcon";

type NomadBootScreenProps = {
  message?: string;
  submessage?: string;
};

export function NomadBootScreen({
  message = "Preparing your journey",
  submessage = "Syncing trails across the steppe…",
}: NomadBootScreenProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#1A1D26] text-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-[#F4C64D]/5 blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 scale-125 animate-ping" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/40 bg-[#252830]/80 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <div className="h-14 w-14 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-400/30 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center translate-y-[4px]">
              <ShagaiIcon size="md" className="opacity-90" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-emerald-400">Nomad</span>
          <span className="text-white">-Go</span>
        </h1>

        <p className="mt-3 text-sm font-medium text-[#A0A0B0] max-w-xs">{message}</p>
        <p className="mt-1 text-xs text-[#6b7280] max-w-sm">{submessage}</p>

        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
