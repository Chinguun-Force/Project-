import { getDb } from "../api/queries/connection";
import { questPool, missions, missionQuests } from "./schema";

async function seed() {
  console.log("Seeding database...");
  const db = getDb();

  // Seed quests
  const quests = [
    {
      title: "Walk 5km in the Steppe",
      description:
        "Experience the vast Mongolian steppe on foot. Walk 5km through the open grasslands and feel the freedom of the endless horizon.",
      baseXp: 150,
      basePoints: 75,
      logicType: "gps" as const,
      category: "daily" as const,
      imageUrl: "/quest-steppe.jpg",
    },
    {
      title: "Try Mongolian Dumplings",
      description:
        "Visit a local restaurant and try traditional Mongolian buuz (steamed dumplings). Take a photo of your meal!",
      baseXp: 80,
      basePoints: 40,
      logicType: "photo" as const,
      category: "global" as const,
      imageUrl: "/quest-dumplings.jpg",
    },
    {
      title: "GPS Check-in at Sukhbaatar Square",
      description:
        "Visit the heart of Ulaanbaatar and check in at Sukhbaatar Square using GPS verification.",
      baseXp: 120,
      basePoints: 60,
      logicType: "gps" as const,
      category: "location_specific" as const,
      imageUrl: "/quest-ulanbaatar.jpg",
    },
    {
      title: "Photo Challenge: Eagle Hunter",
      description:
        "Find and photograph a traditional Mongolian eagle hunter in their distinctive clothing and equipment.",
      baseXp: 200,
      basePoints: 100,
      logicType: "photo" as const,
      category: "location_specific" as const,
      imageUrl: "/quest-terelj.jpg",
    },
    {
      title: "Naadam Festival Quiz",
      description:
        "Test your knowledge about Mongolia's traditional Naadam Festival. Answer 5 questions correctly!",
      baseXp: 100,
      basePoints: 50,
      logicType: "quiz" as const,
      category: "global" as const,
      imageUrl: "/quest-naadam.jpg",
    },
    {
      title: "Visit a Traditional Ger",
      description:
        "Experience Mongolian hospitality by visiting a traditional ger (yurt). Learn about the customs and way of life.",
      baseXp: 180,
      basePoints: 90,
      logicType: "manual" as const,
      category: "location_specific" as const,
      imageUrl: "/quest-steppe.jpg",
    },
    {
      title: "Mongolian Archery Experience",
      description:
        "Try your hand at traditional Mongolian archery. Hit the target at least once to complete this quest!",
      baseXp: 160,
      basePoints: 80,
      logicType: "manual" as const,
      category: "global" as const,
      imageUrl: "/quest-naadam.jpg",
    },
    {
      title: "Terelj National Park Explorer",
      description:
        "Explore the stunning rock formations and pristine nature of Terelj National Park. Complete the guided trail.",
      baseXp: 250,
      basePoints: 125,
      logicType: "gps" as const,
      category: "location_specific" as const,
      imageUrl: "/quest-terelj.jpg",
    },
    {
      title: "Daily Step Count Challenge",
      description: "Walk 10,000 steps today to complete this daily fitness challenge.",
      baseXp: 60,
      basePoints: 30,
      logicType: "manual" as const,
      category: "daily" as const,
      imageUrl: "/quest-steppe.jpg",
    },
    {
      title: "Khuvsgul Lake Photography",
      description:
        "Capture the beauty of the 'Blue Pearl of Mongolia' - Khuvsgul Lake. Share your best photo!",
      baseXp: 300,
      basePoints: 150,
      logicType: "photo" as const,
      category: "location_specific" as const,
      imageUrl: "/quest-steppe.jpg",
    },
  ];

  for (const quest of quests) {
    try {
      await db.insert(questPool).values(quest);
      console.log(`  Created quest: ${quest.title}`);
    } catch (e) {
      console.log(`  Quest already exists: ${quest.title}`);
    }
  }

  // Seed missions
  const missionList = [
    {
      name: "Ulaanbaatar City Center",
      description:
        "Explore the vibrant capital of Mongolia. Visit Sukhbaatar Square, the National Museum, and experience modern Mongolian culture.",
      latitude: 47.9185,
      longitude: 106.9177,
      radius: 2000,
      imageUrl: "/quest-ulanbaatar.jpg",
      region: "Ulaanbaatar",
    },
    {
      name: "Terelj National Park",
      description:
        "Discover stunning granite rock formations, lush valleys, and the famous Turtle Rock in this breathtaking national park.",
      latitude: 47.9077,
      longitude: 107.4333,
      radius: 5000,
      imageUrl: "/quest-terelj.jpg",
      region: "Tuv",
    },
    {
      name: "Gobi Desert Expedition",
      description:
        "Venture into the vast Gobi Desert. Experience camel riding, sand dunes, and the legendary Flaming Cliffs.",
      latitude: 43.5702,
      longitude: 104.4228,
      radius: 10000,
      imageUrl: "/quest-steppe.jpg",
      region: "Omnogovi",
    },
    {
      name: "Kharkhorin Ancient City",
      description:
        "Visit the ancient capital of the Mongol Empire and the magnificent Erdene Zuu Monastery.",
      latitude: 47.1965,
      longitude: 102.8228,
      radius: 3000,
      imageUrl: "/quest-naadam.jpg",
      region: "Ovorhangai",
    },
    {
      name: "Khuvsgul Lake",
      description:
        "Experience the pristine beauty of the 'Blue Pearl of Mongolia' surrounded by mountains and taiga forest.",
      latitude: 51.036,
      longitude: 100.505,
      radius: 8000,
      imageUrl: "/quest-steppe.jpg",
      region: "Khuvsgul",
    },
    {
      name: "Altai Mountains",
      description:
        "Trek through the majestic Altai Mountains, home to eagle hunters and petroglyphs dating back thousands of years.",
      latitude: 48.75,
      longitude: 88.5,
      radius: 15000,
      imageUrl: "/quest-terelj.jpg",
      region: "Bayan-Olgii",
    },
  ];

  const createdMissionIds: number[] = [];
  for (const mission of missionList) {
    try {
      const result = await db.insert(missions).values(mission);
      const id = Number(result[0].insertId);
      createdMissionIds.push(id);
      console.log(`  Created mission: ${mission.name} (ID: ${id})`);
    } catch (e) {
      console.log(`  Mission already exists or error: ${mission.name}`);
    }
  }

  // Link quests to missions
  if (createdMissionIds.length >= 2) {
    try {
      // Link some quests to Ulaanbaatar
      await db.insert(missionQuests).values({
        missionId: createdMissionIds[0],
        questId: 1,
      });
      await db.insert(missionQuests).values({
        missionId: createdMissionIds[0],
        questId: 3,
      });

      // Link some quests to Terelj
      await db.insert(missionQuests).values({
        missionId: createdMissionIds[1],
        questId: 4,
      });
      await db.insert(missionQuests).values({
        missionId: createdMissionIds[1],
        questId: 8,
      });

      console.log("  Linked quests to missions");
    } catch (e) {
      console.log("  Quest-mission links may already exist");
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
