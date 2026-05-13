/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, TravelerType } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: "demo-traveler" },
    update: {},
    create: {
      id: "demo-traveler",
      name: "Аялагч",
      avatarId: "steppe",
      travelerType: TravelerType.explorer,
      xp: 40,
      level: 1,
      onboarded: false,
    },
  });

  const items = [
    {
      slug: "hot-tea-bonus",
      name: "Халуун цайны купон",
      description: "Түнш газарт нэг удаагийн цайны урамшуулал авна.",
      priceXp: 30,
      rarity: "common",
    },
    {
      slug: "culture-hint-pack",
      name: "Соёлын clue багц",
      description: "Соёлын даалгаварт нэмэлт clue нээгдэнэ.",
      priceXp: 55,
      rarity: "rare",
    },
    {
      slug: "legend-frame",
      name: "Домогт profile frame",
      description: "Профайл дээр тусгай хүрээ нээгдэнэ. (Демо)",
      priceXp: 95,
      rarity: "epic",
    },
  ];

  for (const item of items) {
    await prisma.shopItem.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
