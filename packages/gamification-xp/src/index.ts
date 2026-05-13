export type XpInput = {
  currentXp: number;
  gainedXp: number;
  level: number;
};

export type XpResult = {
  xp: number;
  level: number;
  leveledUp: boolean;
};

export const XP_PER_LEVEL = 100;

export function applyXp(input: XpInput): XpResult {
  const safeCurrentXp = Math.max(0, input.currentXp);
  const safeGainedXp = Math.max(0, input.gainedXp);
  let xp = safeCurrentXp + safeGainedXp;
  let level = Math.max(1, input.level);
  let leveledUp = false;

  while (xp >= XP_PER_LEVEL) {
    xp -= XP_PER_LEVEL;
    level += 1;
    leveledUp = true;
  }

  return { xp, level, leveledUp };
}
