import { motion } from 'framer-motion';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export default function XPCard() {
  const { level, currentXP, xpToNextLevel } = usePlayerStore();
  const pct = Math.round((currentXP / xpToNextLevel) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="ng-card p-4 mx-4 mt-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-extrabold text-ng">Nomad Scout · Lv.{level}</span>
        <span className="ng-pill bg-ng-dim text-ng border border-ng-border">Top 4%</span>
      </div>
      <div className="ng-xp-bar mb-2">
        <motion.div
          className="ng-xp-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-bold text-[var(--mu)]">
        <span>{currentXP.toLocaleString()} XP</span>
        <span>{xpToNextLevel.toLocaleString()} XP to Lv.{level + 1}</span>
      </div>
    </motion.div>
  );
}
