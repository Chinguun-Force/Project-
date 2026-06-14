"use client";

import { useRouter } from "next/navigation";
import { Lock, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 pb-24">
      <div className="max-w-md w-full text-center rounded-3xl border border-[#322F36] bg-[#322F36]/40 p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A1D26] border border-[#322F36]">
          <Map className="w-8 h-8 text-[#A0A0B0]/70" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1D26] border border-[#322F36] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#A0A0B0] mb-4">
          <Lock className="w-3 h-3" />
          Coming Soon
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Explore Map</h1>
        <p className="text-sm text-[#A0A0B0] mb-6">
          Interactive aimag map and camp discovery are on the way. Check back in a
          future update.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-[#F4C64D] hover:bg-[#F4C64D]/90 text-[#1A1D26] font-semibold"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
