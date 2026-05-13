/** Minimum cumulative XP required to *be* at each level (1-indexed levels). */
const BASE_THRESHOLDS = [0, 100, 250, 450] as const;

export function getLevelFromXp(xp: number): number {
  if (xp < BASE_THRESHOLDS[1]) return 1;
  if (xp < BASE_THRESHOLDS[2]) return 2;
  if (xp < BASE_THRESHOLDS[3]) return 3;
  let level = 4;
  let low = BASE_THRESHOLDS[3];
  let step = 200;
  while (xp >= low + step) {
    low += step;
    level += 1;
    step += 50;
  }
  return level;
}

export function getThresholdForLevel(level: number): number {
  if (level <= 1) return BASE_THRESHOLDS[0];
  if (level === 2) return BASE_THRESHOLDS[1];
  if (level === 3) return BASE_THRESHOLDS[2];
  if (level === 4) return BASE_THRESHOLDS[3];
  let total = BASE_THRESHOLDS[3];
  let step = 200;
  for (let l = 4; l < level; l++) {
    total += step;
    step += 50;
  }
  return total;
}

export function getNextLevelThreshold(currentXp: number): number {
  const level = getLevelFromXp(currentXp);
  return getThresholdForLevel(level + 1);
}

export function getXpProgress(currentXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percent: number;
} {
  const level = getLevelFromXp(currentXp);
  const floor = getThresholdForLevel(level);
  const ceiling = getThresholdForLevel(level + 1);
  const xpIntoLevel = currentXp - floor;
  const xpForNextLevel = ceiling - floor;
  const percent =
    xpForNextLevel > 0
      ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100))
      : 100;
  return { level, xpIntoLevel, xpForNextLevel, percent };
}
