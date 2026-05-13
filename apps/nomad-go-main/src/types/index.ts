export type QuestCategory = "food" | "culture" | "nature" | "challenge";

export type QuestDifficulty = "easy" | "medium" | "hard";

export type QuestStatus = "available" | "in_progress" | "completed";

export type TravelerType =
  | "explorer"
  | "food-hunter"
  | "culture-seeker"
  | "adventure-rider";

export const TRAVELER_LABELS: Record<TravelerType, string> = {
  explorer: "Судлаач",
  "food-hunter": "Амт хайгч",
  "culture-seeker": "Соёл сонирхогч",
  "adventure-rider": "Адал явдал хайгч",
};

export const AVATAR_OPTIONS = [
  { id: "aurora", emoji: "🌌", label: "Тэнгэрийн нүүдэлчин" },
  { id: "steppe", emoji: "🐎", label: "Талын хүлэг" },
  { id: "ember", emoji: "🔥", label: "Галын харуул" },
  { id: "peak", emoji: "⛰️", label: "Оргилын мөрдөст" },
  { id: "river", emoji: "🌊", label: "Голын урсгал" },
] as const;
