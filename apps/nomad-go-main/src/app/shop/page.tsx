"use client";

import { useEffect, useState } from "react";
import { ShopItemCard } from "@/components/shop/ShopItemCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useToast } from "@/components/ui/ToastHost";
import { useGameStore } from "@/store/useGameStore";

export default function ShopPage() {
  const toast = useToast();
  const shopItems = useGameStore((s) => s.shopItems);
  const wallet = useGameStore((s) => s.wallet);
  const loadingShop = useGameStore((s) => s.loadingShop);
  const fetchShopItems = useGameStore((s) => s.fetchShopItems);
  const purchaseShopItem = useGameStore((s) => s.purchaseShopItem);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchShopItems();
  }, [fetchShopItems]);

  const handleBuy = async (itemId: string) => {
    setPendingId(itemId);
    try {
      const message = await purchaseShopItem(itemId);
      toast(message, "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Худалдан авахад алдаа гарлаа.",
        "info",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-4 pb-16 md:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          XP Дэлгүүр
        </p>
        <h1 className="sim-heading mt-2 text-2xl font-bold tracking-tight">XP дэлгүүр</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Даалгавраас авсан XP-ээ item авахад ашиглаарай.
        </p>
      </div>

      <section className="game-panel-strong rounded-2xl p-5">
        <SectionTitle title="Таны XP үлдэгдэл" />
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-teal-700">
          {wallet.xpBalance} XP
        </p>
      </section>

      {loadingShop ? (
        <p className="text-sm text-stone-600">Дэлгүүр ачаалж байна...</p>
      ) : shopItems.length === 0 ? (
        <EmptyState
          title="Одоогоор бараа алга"
          description="Дараа дахин шалгаарай."
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {shopItems.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              xpBalance={wallet.xpBalance}
              pending={pendingId === item.id}
              onBuy={handleBuy}
            />
          ))}
        </section>
      )}
    </div>
  );
}
