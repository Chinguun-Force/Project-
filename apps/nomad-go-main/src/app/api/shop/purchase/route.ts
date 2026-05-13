import { XpSourceType } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  DEMO_USER_ID,
  applyXpChange,
  ensureDemoUser,
  getProfileSnapshot,
} from "@/lib/server/game";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { itemId?: string; slug?: string };
    const itemId = body.itemId?.trim();
    const slug = body.slug?.trim();

    if (!itemId && !slug) {
      return NextResponse.json(
        { message: "Item ID эсвэл slug шаардлагатай." },
        { status: 400 },
      );
    }

    await ensureDemoUser();

    const item = itemId
      ? await prisma.shopItem.findUnique({ where: { id: itemId } })
      : await prisma.shopItem.findUnique({ where: { slug: slug! } });

    if (!item || !item.active) {
      return NextResponse.json({ message: "Бараа олдсонгүй." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: DEMO_USER_ID },
        select: { xp: true },
      });

      if (user.xp < item.priceXp) {
        throw new Error("insufficient_xp");
      }

      await tx.inventoryItem.upsert({
        where: {
          userId_shopItemId: {
            userId: DEMO_USER_ID,
            shopItemId: item.id,
          },
        },
        update: {
          quantity: {
            increment: 1,
          },
        },
        create: {
          userId: DEMO_USER_ID,
          shopItemId: item.id,
          quantity: 1,
        },
      });

      await applyXpChange({
        tx,
        userId: DEMO_USER_ID,
        delta: -item.priceXp,
        sourceType: XpSourceType.SHOP_PURCHASE,
        sourceId: item.id,
        note: `Дэлгүүрийн худалдан авалт: ${item.name}`,
      });
    });

    const snapshot = await getProfileSnapshot(DEMO_USER_ID);
    return NextResponse.json({
      message: `${item.name} амжилттай авлаа.`,
      snapshot,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "insufficient_xp") {
      return NextResponse.json({ message: "XP хүрэлцэхгүй байна." }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Худалдан авахад алдаа гарлаа.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
