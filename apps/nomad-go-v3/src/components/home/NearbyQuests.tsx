import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { QUESTS } from '@/lib/data/quests';
import { difficultyColor, difficultyLabel } from '@/lib/utils/xp';
import { MapPin, Clock, Zap } from 'lucide-react';

export default function NearbyQuests() {
  const nearby = QUESTS.filter((q) => q.status !== 'completed').slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.4 }}
      className="px-4 mt-5 pb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-extrabold text-ng-tx">Nearby Quests</h2>
        <Link to="/quests" className="text-[11px] font-bold text-ng">See all →</Link>
      </div>
      <div className="flex flex-col gap-3">
        {nearby.map((quest, i) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.45 + i * 0.08 }}
          >
            <Link
              to={`/quests/${quest.id}`}
              className="ng-card p-3 flex items-center gap-3 hover:translate-x-[3px] transition-transform duration-150"
            >
              <div className="w-11 h-11 rounded-[var(--r)] bg-[var(--bg2)] flex items-center justify-center text-xl shrink-0">
                {quest.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-[13px] font-extrabold text-ng-tx truncate">{quest.title}</h3>
                  <span className={`ng-pill border ${difficultyColor(quest.difficulty)}`}>
                    {difficultyLabel(quest.difficulty)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--mu)]">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    {quest.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {quest.duration}
                  </span>
                  <span className="flex items-center gap-1 text-ng">
                    <Zap size={11} />
                    +{quest.xpReward} XP
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
