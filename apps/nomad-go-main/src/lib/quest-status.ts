import type { Quest } from "@/data/quests";
import type { QuestStatus } from "@/types";

export function resolveQuestStatus(
  quest: Quest,
  activeQuestIds: string[],
  completedQuestIds: string[],
): QuestStatus {
  if (completedQuestIds.includes(quest.id)) return "completed";
  if (activeQuestIds.includes(quest.id)) return "in_progress";
  return "available";
}
