"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BagItemCard } from "@/components/bag/BagItemCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useGameStore } from "@/store/useGameStore";

export default function BagPage() {
  const inventory = useGameStore((s) => s.inventory);
  const wallet = useGameStore((s) => s.wallet);
  const fetchBag = useGameStore((s) => s.fetchBag);

  useEffect(() => {
    void fetchBag();
  }, [fetchBag]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-4 pb-16 md:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          Цүнх
        </p>
        <h1 className="sim-heading mt-2 text-2xl font-bold tracking-tight">Миний цүнх</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Худалдан авсан бараанууд энд хадгалагдана.
        </p>
      </div>

      <section className="game-panel-strong rounded-2xl p-5">
        <SectionTitle title="Одоогийн XP" />
        <p className="mt-2 bg-gradient-to-r from-teal-700 to-sky-600 bg-clip-text text-xl font-bold tabular-nums text-transparent">
          {wallet.xpBalance} XP
        </p>
        <Link
          href="/shop"
          className="mt-3 inline-flex text-sm font-semibold text-amber-800 underline-offset-2 transition duration-500 hover:text-amber-900 hover:underline"
        >
          XP дэлгүүр рүү очих →
        </Link>
      </section>

      {inventory.length === 0 ? (
        <EmptyState
          title="Цүнх хоосон байна"
          description="Эхлээд XP дэлгүүрээс бараа аваарай."
        />
      ) : (
        <section className="space-y-3">
          {inventory.map((entry) => (
            <BagItemCard key={entry.id} entry={entry} />
          ))}
        </section>
      )}
    </div>
  );
}
