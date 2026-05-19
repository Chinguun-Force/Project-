import { Link } from 'react-router';
import { motion } from 'framer-motion';
import type { Quest } from '@/lib/data/quests';
import { difficultyColor, difficultyLabel } from '@/lib/utils/xp';
import { MapPin, Clock, Zap, Lock, CheckCircle2 } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  index?: number;
  isCompleted?: boolean;
  isLocked?: boolean;
}

export default function QuestCard({ quest, index = 0, isCompleted = false, isLocked = false }: QuestCardProps) {
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.05 }}
        className="ng-card p-3 flex items-center gap-3 opacity-50"
      >
        <div className="w-11 h-11 rounded-[var(--r)] bg-[var(--bg2)] flex items-center justify-center shrink-0">
          <Lock size={18} className="text-[var(--mu)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-extrabold text-[var(--mu)] truncate">{quest.title}</h3>
          <p className="text-[11px] font-bold text-[var(--ft)]">
            Unlock at Level {quest.unlockLevel}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Link
        to={`/quests/${quest.id}`}
        className={`ng-card p-3 flex items-center gap-3 hover:translate-x-[3px] transition-transform duration-150 ${
          isCompleted ? 'border-ng/40' : ''
        }`}
      >
        <div className="w-11 h-11 rounded-[var(--r)] bg-[var(--bg2)] flex items-center justify-center text-xl shrink-0">
          {isCompleted ? <CheckCircle2 size={20} className="text-ng" /> : quest.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-[13px] font-extrabold truncate ${isCompleted ? 'text-ng' : 'text-ng-tx'}`}>
              {quest.title}
            </h3>
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
  );
}
