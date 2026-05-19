export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockLevel: number;
}

export const BADGES: BadgeDef[] = [
  { id: 'b1', name: 'First Steps', icon: '👣', description: 'Complete your first quest', unlockLevel: 1 },
  { id: 'b2', name: 'Steppe Walker', icon: '🌿', description: 'Reach level 5', unlockLevel: 5 },
  { id: 'b3', name: 'Camp Seeker', icon: '🏕️', description: 'Reach level 10', unlockLevel: 10 },
  { id: 'b4', name: 'Trail Blazer', icon: '⚡', description: 'Reach level 13', unlockLevel: 13 },
  { id: 'b5', name: 'Nomad Scout', icon: '🧭', description: 'Reach level 12', unlockLevel: 12 },
  { id: 'b6', name: 'Eagle Eye', icon: '🦅', description: 'Witness eagle hunting', unlockLevel: 14 },
  { id: 'b7', name: 'Desert Crosser', icon: '🏜️', description: 'Complete a Gobi quest', unlockLevel: 15 },
  { id: 'b8', name: 'Culturalist', icon: '🏛️', description: 'Visit 5 monasteries', unlockLevel: 8 },
];

export interface LevelDef {
  level: number;
  name: string;
  icon: string;
  widthPct: number;
}

export const LEVELS: LevelDef[] = [
  { level: 15, name: 'Eagle Nomad', icon: '🦅', widthPct: 100 },
  { level: 14, name: 'Steppe Walker', icon: '🌿', widthPct: 88 },
  { level: 13, name: 'Trail Blazer', icon: '⚡', widthPct: 76 },
  { level: 12, name: 'Nomad Scout', icon: '🧭', widthPct: 64 },
  { level: 10, name: 'Camp Seeker', icon: '🏕️', widthPct: 52 },
  { level: 5, name: 'Wanderer', icon: '🌱', widthPct: 40 },
  { level: 1, name: 'Rookie', icon: '🥾', widthPct: 30 },
];
