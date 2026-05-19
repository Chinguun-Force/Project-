import { motion } from 'framer-motion';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import AvatarRing from '@/components/profile/AvatarRing';
import BadgeShelf from '@/components/profile/BadgeShelf';
import LevelTree from '@/components/profile/LevelTree';
import { Lock } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const REWARDS = [
  { name: 'Ger Camp Access', icon: '⛺', locked: false },
  { name: 'Eagle Badge', icon: '🦅', locked: true },
  { name: 'Hidden Routes', icon: '🗺️', locked: true },
  { name: 'Gobi Quest', icon: '🏜️', locked: true },
];

export default function ProfilePage() {
  const { username, level, currentXP, xpToNextLevel, totalXP, streak, completedQuestIds, earnedBadgeIds } = usePlayerStore();
  const pct = Math.round((currentXP / xpToNextLevel) * 100);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="px-4 pt-4 pb-28">
      {/* Avatar ring */}
      <div className="flex flex-col items-center mb-4">
        <AvatarRing level={level} avatar="🧭" />
        <h2 className="mt-3 font-display text-[20px] font-black text-ng-tx">{username}</h2>
        <p className="text-[11px] font-bold text-[var(--mu)]">Joined April 2026 · 🇲🇳 Mongolia</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="ng-pill bg-ng-dim text-ng border border-ng-border">Top 4%</span>
          <span className="ng-pill bg-no-dim text-no border border-[rgba(255,107,53,0.28)]">🔥 {streak} day streak</span>
        </div>
      </div>

      {/* XP progress card */}
      <div className="ng-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-extrabold text-ng-tx">Level {level}</span>
          <span className="text-[11px] font-bold text-[var(--mu)]">{pct}% to Lv.{level + 1}</span>
        </div>
        <div className="ng-xp-bar mb-3">
          <motion.div
            className="ng-xp-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-[var(--bg2)] rounded-[var(--r)] p-2">
            <p className="text-[15px] font-black text-ng-tx">{completedQuestIds.length}</p>
            <p className="text-[10px] font-bold text-[var(--mu)]">Quests</p>
          </div>
          <div className="bg-[var(--bg2)] rounded-[var(--r)] p-2">
            <p className="text-[15px] font-black text-ng-tx">{totalXP.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-[var(--mu)]">XP</p>
          </div>
          <div className="bg-[var(--bg2)] rounded-[var(--r)] p-2">
            <p className="text-[15px] font-black text-ng-tx">{earnedBadgeIds.length}</p>
            <p className="text-[10px] font-bold text-[var(--mu)]">Badges</p>
          </div>
          <div className="bg-[var(--bg2)] rounded-[var(--r)] p-2">
            <p className="text-[15px] font-black text-ng-tx">{streak}</p>
            <p className="text-[10px] font-bold text-[var(--mu)]">Streak</p>
          </div>
        </div>
      </div>

      {/* Badge shelf */}
      <div className="mb-4">
        <h3 className="text-[15px] font-extrabold text-ng-tx mb-2">Badges</h3>
        <BadgeShelf earnedBadgeIds={earnedBadgeIds} />
      </div>

      {/* Level tree */}
      <div className="mb-4">
        <h3 className="text-[15px] font-extrabold text-ng-tx mb-2">Level Tree</h3>
        <LevelTree level={level} currentXP={currentXP} xpToNextLevel={xpToNextLevel} />
      </div>

      {/* Unlockable rewards */}
      <div>
        <h3 className="text-[15px] font-extrabold text-ng-tx mb-2">Unlockable Rewards</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {REWARDS.map((reward) => (
            <div
              key={reward.name}
              className={`ng-card p-3 min-w-[120px] flex flex-col items-center text-center ${
                reward.locked ? 'opacity-50' : ''
              }`}
            >
              <div className="text-3xl mb-2">{reward.icon}</div>
              <p className="text-[12px] font-extrabold text-ng-tx">{reward.name}</p>
              {reward.locked && (
                <p className="text-[10px] font-bold text-[var(--ft)] mt-1 flex items-center gap-1">
                  <Lock size={10} /> Locked
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
