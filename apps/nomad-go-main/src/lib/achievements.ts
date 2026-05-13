import type { Quest } from "@/data/quests";

export type AchievementId =
  | "first-quest"
  | "xp-100"
  | "culture-hunter"
  | "hidden-gem";

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-quest",
    title: "Анхны даалгавар",
    description: "Эхний даалгавраа амжилттай дуусга.",
    icon: "🎯",
  },
  {
    id: "xp-100",
    title: "100 XP клуб",
    description: "100 XP давж шинэ түвшинд дөх.",
    icon: "💯",
  },
  {
    id: "culture-hunter",
    title: "Соёлын анчин",
    description: "“Соёл” төрлийн даалгавар дуусга.",
    icon: "🏛️",
  },
  {
    id: "hidden-gem",
    title: "Нууц эрдэнэ ологч",
    description: "“Нууц хоол олох” даалгаврыг дуусга.",
    icon: "🥟",
  },
];

export function computeUnlockedAchievements(input: {
  xp: number;
  completedQuestIds: string[];
  questsById: Map<string, Quest>;
}): AchievementId[] {
  const { xp, completedQuestIds, questsById } = input;
  const unlocked = new Set<AchievementId>();

  if (completedQuestIds.length > 0) unlocked.add("first-quest");
  if (xp >= 100) unlocked.add("xp-100");
  if (completedQuestIds.includes("hidden-buuz-alley")) unlocked.add("hidden-gem");

  for (const id of completedQuestIds) {
    const q = questsById.get(id);
    if (q?.category === "culture") {
      unlocked.add("culture-hunter");
      break;
    }
  }

  return Array.from(unlocked);
}
