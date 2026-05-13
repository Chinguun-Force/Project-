import { NextResponse } from "next/server";
import { ensureDemoUser } from "@/lib/server/game";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await ensureDemoUser();

    const items = await prisma.shopItem.findMany({
      where: { active: true },
      orderBy: [{ priceXp: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        priceXp: item.priceXp,
        rarity: item.rarity,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Shop-ийн өгөгдөл уншихад алдаа гарлаа.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
