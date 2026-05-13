import { XpSourceType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getQuestById, getQuestRewardXp } from "@/data/quests";
import {
  DEMO_USER_ID,
  applyXpChange,
  ensureDemoUser,
  getProfileSnapshot,
} from "@/lib/server/game";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      questId?: string;
      proofPhoto?: boolean;
      proofGps?: boolean;
    };

    const questId = body.questId?.trim();
    if (!questId) {
      return NextResponse.json({ message: "Даалгаврын ID шаардлагатай." }, { status: 400 });
    }

    const quest = getQuestById(questId);
    if (!quest) {
      return NextResponse.json({ message: "Даалгавар олдсонгүй." }, { status: 404 });
    }

    if (!body.proofPhoto || !body.proofGps) {
      return NextResponse.json(
        { message: "Зураг болон GPS нотолгоо шаардлагатай." },
        { status: 400 },
      );
    }

    const rewardXp = getQuestRewardXp(quest);
    await ensureDemoUser();

    await prisma.$transaction(async (tx) => {
      const duplicate = await tx.questCompletion.findUnique({
        where: {
          userId_questId: {
            userId: DEMO_USER_ID,
            questId,
          },
        },
      });

      if (duplicate) {
        throw new Error("already_completed");
      }

      await tx.questCompletion.create({
        data: {
          userId: DEMO_USER_ID,
          questId,
          rewardXp,
          proofPhoto: Boolean(body.proofPhoto),
          proofGps: Boolean(body.proofGps),
        },
      });

      await tx.activeQuest.deleteMany({
        where: {
          userId: DEMO_USER_ID,
          questId,
        },
      });

      await applyXpChange({
        tx,
        userId: DEMO_USER_ID,
        delta: rewardXp,
        sourceType: XpSourceType.QUEST_COMPLETE,
        sourceId: questId,
        note: `Даалгавар дууслаа: ${quest.title}`,
      });
    });

    const snapshot = await getProfileSnapshot(DEMO_USER_ID);
    return NextResponse.json({
      message: `🎉 Та даалгаврыг амжилттай биелүүллээ! +${rewardXp} XP`,
      rewardXp,
      snapshot,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "already_completed") {
      return NextResponse.json(
        { message: "Энэ даалгавар өмнө нь дууссан байна." },
        { status: 409 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Даалгавар дуусгахад алдаа гарлаа.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
