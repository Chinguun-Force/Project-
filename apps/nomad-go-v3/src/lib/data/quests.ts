export type Difficulty = 'easy' | 'med' | 'hard' | 'epic';
export type QuestStatus = 'active' | 'locked' | 'completed';

export interface Quest {
  id: string;
  icon: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
  distance: string;
  duration: string;
  status: QuestStatus;
  province: string;
  unlockLevel?: number;
}

export const QUESTS: Quest[] = [
  { id: 'q1', icon: '🏔️', title: 'Conquer Terelj Peak', difficulty: 'hard', xpReward: 320, distance: '2.1km', duration: '~3hrs', status: 'active', province: 'Улаанбаатар', description: 'Hike to the summit of Turtle Rock in Terelj National Park. Capture a panoramic photo from the top.' },
  { id: 'q2', icon: '🏛️', title: 'Gandan Monastery', difficulty: 'easy', xpReward: 80, distance: '0.4km', duration: '1hr', status: 'active', province: 'Улаанбаатар', description: 'Explore the largest Buddhist monastery complex in Ulaanbaatar.' },
  { id: 'q3', icon: '🐎', title: 'Horse Riding Trial', difficulty: 'med', xpReward: 200, distance: '15km', duration: 'Half day', status: 'active', province: 'Төв', description: 'Ride a Mongolian horse through the steppe for 2 hours.' },
  { id: 'q4', icon: '🏜️', title: 'Gobi Desert Cross', difficulty: 'epic', xpReward: 850, distance: '350km', duration: '3 days', status: 'locked', province: 'Өмнөговь', description: 'Cross the Gobi Desert from north to south.', unlockLevel: 15 },
  { id: 'q5', icon: '🏛️', title: 'Karakorum Ruins', difficulty: 'med', xpReward: 180, distance: '380km', duration: '1 day', status: 'active', province: 'Өвөрхангай', description: 'Visit the ruins of the ancient Mongolian capital Karakorum.' },
  { id: 'q6', icon: '🦅', title: 'Eagle Hunter Ceremony', difficulty: 'hard', xpReward: 400, distance: '1200km', duration: '2 days', status: 'active', province: 'Баян-Өлгий', description: "Witness the ancient Kazakh eagle hunting tradition." },
  { id: 'q7', icon: '🏕️', title: 'Gandan Monastery Visit', difficulty: 'easy', xpReward: 120, distance: '0.4km', duration: '1hr', status: 'completed', province: 'Улаанбаатар', description: 'Completed.' },
  { id: 'q8', icon: '🌋', title: 'Khorgo Volcano Hike', difficulty: 'med', xpReward: 250, distance: '520km', duration: '2 days', status: 'active', province: 'Архангай', description: 'Hike around the extinct Khorgo volcano and swim in White Lake.' },
  { id: 'q9', icon: '🐪', title: 'Camel Trek — Khongor Dunes', difficulty: 'hard', xpReward: 380, distance: '350km', duration: '2 days', status: 'locked', province: 'Өмнөговь', description: 'Ride a Bactrian camel across the Khongor sand dunes.', unlockLevel: 12 },
  { id: 'q10', icon: '🎪', title: 'Naadam Festival Quest', difficulty: 'easy', xpReward: 150, distance: '0km', duration: '1 day', status: 'active', province: 'Улаанбаатар', description: "Attend Mongolia's national Naadam festival and witness the Three Games." },
];
