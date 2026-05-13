import { NextResponse } from "next/server";
import { getQuestById } from "@/data/quests";
import { DEMO_USER_ID, ensureDemoUser, getProfileSnapshot } from "@/lib/server/game";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { questId?: string };
    const questId = body.questId?.trim();

    if (!questId) {
      return NextResponse.json({ message: "Даалгаврын ID шаардлагатай." }, { status: 400 });
    }

    const quest = getQuestById(questId);
    if (!quest) {
      return NextResponse.json({ message: "Даалгавар олдсонгүй." }, { status: 404 });
    }

    await ensureDemoUser();

    const alreadyCompleted = await prisma.questCompletion.findUnique({
      where: {
        userId_questId: {
          userId: DEMO_USER_ID,
          questId,
        },
      },
    });

    if (alreadyCompleted) {
      return NextResponse.json(
        { message: "Энэ даалгавар өмнө нь дууссан байна." },
        { status: 409 },
      );
    }

    await prisma.activeQuest.upsert({
      where: {
        userId_questId: {
          userId: DEMO_USER_ID,
          questId,
        },
      },
      update: {},
      create: {
        userId: DEMO_USER_ID,
        questId,
      },
    });

    const snapshot = await getProfileSnapshot(DEMO_USER_ID);
    return NextResponse.json({
      message: "Даалгавар эхэллээ.",
      snapshot,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Даалгавар эхлүүлэхэд алдаа гарлаа.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
