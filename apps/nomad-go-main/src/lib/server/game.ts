import {
  Prisma,
  TravelerType as DbTravelerType,
  XpSourceType,
  type User,
} from "@prisma/client";
import type { TravelerType } from "@/types";
import { getLevelFromXp } from "@/lib/xp";
import { prisma } from "@/lib/server/prisma";

export const DEMO_USER_ID = "demo-traveler";

function toDbTravelerType(value: TravelerType): DbTravelerType {
  if (value === "food-hunter") return DbTravelerType.food_hunter;
  if (value === "culture-seeker") return DbTravelerType.culture_seeker;
  if (value === "adventure-rider") return DbTravelerType.adventure_rider;
  return DbTravelerType.explorer;
}

function toClientTravelerType(value: DbTravelerType): TravelerType {
  if (value === DbTravelerType.food_hunter) return "food-hunter";
  if (value === DbTravelerType.culture_seeker) return "culture-seeker";
  if (value === DbTravelerType.adventure_rider) return "adventure-rider";
  return "explorer";
}

export async function ensureDemoUser(): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { id: DEMO_USER_ID },
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      name: "Аялагч",
      avatarId: "steppe",
      travelerType: DbTravelerType.explorer,
      xp: 40,
      level: getLevelFromXp(40),
      onboarded: false,
    },
  });
}

export async function applyXpChange(input: {
  userId: string;
  delta: number;
  sourceType: XpSourceType;
  sourceId?: string;
  note?: string;
  metadata?: Record<string, unknown>;
  tx?: Prisma.TransactionClient;
}) {
  const run = input.tx ?? prisma;

  const user = await run.user.findUnique({
    where: { id: input.userId },
    select: { xp: true },
  });

  if (!user) {
    throw new Error("Хэрэглэгч олдсонгүй.");
  }

  const nextXp = Math.max(0, user.xp + input.delta);
  const appliedDelta = nextXp - user.xp;
  const nextLevel = getLevelFromXp(nextXp);

  const entry = await run.xpLedger.create({
    data: {
      userId: input.userId,
      delta: appliedDelta,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      note: input.note,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  const updatedUser = await run.user.update({
    where: { id: input.userId },
    data: {
      xp: nextXp,
      level: nextLevel,
    },
  });

  return { entry, user: updatedUser, appliedDelta };
}

export async function getProfileSnapshot(userId = DEMO_USER_ID) {
  await ensureDemoUser();

  const [user, active, completed, inventory, ledger] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
    }),
    prisma.activeQuest.findMany({
      where: { userId },
      select: { questId: true },
    }),
    prisma.questCompletion.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      select: { questId: true },
    }),
    prisma.inventoryItem.findMany({
      where: { userId },
      include: {
        shopItem: true,
      },
      orderBy: { acquiredAt: "desc" },
    }),
    prisma.xpLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return {
    user: {
      id: user.id,
      name: user.name,
      avatarId: user.avatarId,
      travelerType: toClientTravelerType(user.travelerType),
      xp: user.xp,
      level: user.level,
      onboarded: user.onboarded,
      activeQuestIds: active.map((q) => q.questId),
      completedQuestIds: completed.map((q) => q.questId),
    },
    wallet: {
      xpBalance: user.xp,
    },
    inventory: inventory.map((entry) => ({
      id: entry.id,
      quantity: entry.quantity,
      acquiredAt: entry.acquiredAt.toISOString(),
      item: {
        id: entry.shopItem.id,
        slug: entry.shopItem.slug,
        name: entry.shopItem.name,
        description: entry.shopItem.description,
        priceXp: entry.shopItem.priceXp,
        rarity: entry.shopItem.rarity,
      },
    })),
    ledgerPreview: ledger.map((entry) => ({
      id: entry.id,
      delta: entry.delta,
      sourceType: entry.sourceType,
      sourceId: entry.sourceId,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function updateDemoUserProfile(input: {
  name?: string;
  avatarId?: string;
  travelerType?: TravelerType;
  onboarded?: boolean;
}) {
  await ensureDemoUser();

  await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({
      where: { id: DEMO_USER_ID },
      select: { name: true, onboarded: true },
    });

    const incomingName = input.name?.trim();
    const switchedIdentity =
      Boolean(incomingName) &&
      current.onboarded &&
      current.name.trim().toLocaleLowerCase() !== incomingName!.toLocaleLowerCase();

    // In demo mode we only have one backing user. When a new name starts onboarding,
    // reset shared progress so previous player's XP/inventory does not leak.
    if (switchedIdentity) {
      await tx.activeQuest.deleteMany({
        where: { userId: DEMO_USER_ID },
      });
      await tx.questCompletion.deleteMany({
        where: { userId: DEMO_USER_ID },
      });
      await tx.xpLedger.deleteMany({
        where: { userId: DEMO_USER_ID },
      });
      await tx.inventoryItem.deleteMany({
        where: { userId: DEMO_USER_ID },
      });
    }

    const data: Prisma.UserUpdateInput = {};
    if (incomingName) data.name = incomingName;
    if (input.avatarId) data.avatarId = input.avatarId;
    if (typeof input.onboarded === "boolean") data.onboarded = input.onboarded;
    if (input.travelerType) data.travelerType = toDbTravelerType(input.travelerType);

    if (switchedIdentity) {
      data.xp = 40;
      data.level = getLevelFromXp(40);
    }

    await tx.user.update({
      where: { id: DEMO_USER_ID },
      data,
    });
  });

  return getProfileSnapshot(DEMO_USER_ID);
}

export async function resetDemoUser() {
  await ensureDemoUser();

  await prisma.$transaction(async (tx) => {
    await tx.activeQuest.deleteMany({
      where: { userId: DEMO_USER_ID },
    });
    await tx.questCompletion.deleteMany({
      where: { userId: DEMO_USER_ID },
    });
    await tx.xpLedger.deleteMany({
      where: { userId: DEMO_USER_ID },
    });
    await tx.inventoryItem.deleteMany({
      where: { userId: DEMO_USER_ID },
    });
    await tx.user.update({
      where: { id: DEMO_USER_ID },
      data: {
        name: "Аялагч",
        avatarId: "steppe",
        travelerType: DbTravelerType.explorer,
        xp: 40,
        level: getLevelFromXp(40),
        onboarded: false,
      },
    });
  });

  return getProfileSnapshot(DEMO_USER_ID);
}
