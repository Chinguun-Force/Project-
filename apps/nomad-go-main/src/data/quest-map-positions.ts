/** Fake map pin positions (% of map container) — UI-тэй давхцахгүй төв хэсэг рүү ойртуулсан */
export const QUEST_MAP_POSITION: Record<string, { left: string; top: string }> = {
  "ulan-bator-cafe-run": { left: "26%", top: "36%" },
  "erdene-zuu-pilgrimage": { left: "38%", top: "48%" },
  "narantuul-market-hunt": { left: "22%", top: "42%" },
  "terelj-viewpoint-ascent": { left: "48%", top: "62%" },
  "choijin-museum-night": { left: "20%", top: "38%" },
  "orkhon-campfire-chronicle": { left: "44%", top: "52%" },
  "hustai-horse-heritage": { left: "54%", top: "56%" },
  "hidden-buuz-alley": { left: "32%", top: "44%" },
};

export function getQuestMapPosition(
  questId: string,
): { left: string; top: string } {
  return QUEST_MAP_POSITION[questId] ?? { left: "50%", top: "50%" };
}
