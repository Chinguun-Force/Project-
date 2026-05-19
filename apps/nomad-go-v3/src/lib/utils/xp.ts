export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.6));
}

export function levelFromXP(xp: number): { level: number; currentXP: number; xpToNext: number } {
  let level = 1;
  let prev = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (xp < needed) {
      return { level, currentXP: xp - prev, xpToNext: needed - prev };
    }
    prev = needed;
    level++;
    if (level > 50) break;
  }
  return { level: 50, currentXP: 0, xpToNext: 0 };
}

export function difficultyColor(d: string): string {
  switch (d) {
    case 'easy': return 'bg-[rgba(0,153,204,0.12)] text-[#0099CC] border-[rgba(0,153,204,0.28)]';
    case 'med': return 'bg-[rgba(212,160,0,0.12)] text-[#D4A000] border-[rgba(212,160,0,0.28)]';
    case 'hard': return 'bg-[rgba(255,107,53,0.12)] text-[#FF6B35] border-[rgba(255,107,53,0.28)]';
    case 'epic': return 'bg-[rgba(156,39,176,0.12)] text-[#9C27B0] border-[rgba(156,39,176,0.28)]';
    default: return 'bg-[var(--bg3)] text-[var(--mu)] border-[var(--bdr)]';
  }
}

export function difficultyLabel(d: string): string {
  switch (d) {
    case 'easy': return 'Easy';
    case 'med': return 'Medium';
    case 'hard': return 'Hard';
    case 'epic': return 'Epic';
    default: return d;
  }
}
