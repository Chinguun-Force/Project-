import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { levelFromXP } from '@/lib/utils/xp';

interface PlayerState {
  username: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  streak: number;
  completedQuestIds: string[];
  earnedBadgeIds: string[];
  addXP: (amount: number) => void;
  completeQuest: (questId: string) => void;
  setUsername: (name: string) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      username: 'NomadTraveler',
      level: 12,
      currentXP: 2850,
      xpToNextLevel: 4000,
      totalXP: 12450,
      streak: 7,
      completedQuestIds: ['q7'],
      earnedBadgeIds: ['b1', 'b2', 'b3'],

      addXP: (amount: number) => {
        set((state) => {
          const newTotal = state.totalXP + amount;
          const { level, currentXP, xpToNext } = levelFromXP(newTotal);
          return {
            totalXP: newTotal,
            level,
            currentXP,
            xpToNextLevel: xpToNext,
          };
        });
      },

      completeQuest: (questId: string) => {
        set((state) => {
          if (state.completedQuestIds.includes(questId)) return state;
          const newCompleted = [...state.completedQuestIds, questId];
          const newTotal = state.totalXP + 0; // XP is added separately via addXP
          const { level, currentXP, xpToNext } = levelFromXP(newTotal);
          return {
            completedQuestIds: newCompleted,
            totalXP: newTotal,
            level,
            currentXP,
            xpToNextLevel: xpToNext,
            streak: state.streak + 1,
          };
        });
      },

      setUsername: (name: string) => set({ username: name }),
    }),
    {
      name: 'nomadgo-player',
    }
  )
);
