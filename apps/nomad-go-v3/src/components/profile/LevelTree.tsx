import { motion } from 'framer-motion';
import { LEVELS } from '@/lib/data/badges';
import { Lock, CheckCircle2 } from 'lucide-react';

interface LevelTreeProps {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
}

export default function LevelTree({ level, currentXP, xpToNextLevel }: LevelTreeProps) {
  const pct = Math.round((currentXP / xpToNextLevel) * 100);

  return (
    <div className="flex flex-col items-center gap-1">
      {LEVELS.map((node, idx) => {
        const isCurrent = node.level === level;
        const isDone = node.level < level;
        const isNext = node.level === level + 1;
        const isLocked = node.level > level + 1;
        return (
          <div key={node.level} className="flex flex-col items-center w-full">
            <div
              className={`ng-card p-2.5 flex items-center gap-2 transition-all ${
                isCurrent ? 'border-ng/50 bg-ng-dim' : isDone ? 'border-ng/30' : 'opacity-50'
              }`}
              style={{ width: `${node.widthPct}%` }}
            >
              <div className="text-xl">{node.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-extrabold truncate ${isCurrent ? 'text-ng' : 'text-ng-tx'}`}>
                  Lv.{node.level} — {node.name}
                </p>
                {isCurrent && (
                  <div className="ng-xp-bar mt-1">
                    <motion.div
                      className="ng-xp-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                    />
                  </div>
                )}
                {isNext && (
                  <div className="ng-xp-bar mt-1">
                    <div className="h-full rounded-full bg-no" style={{ width: '12%' }} />
                  </div>
                )}
                {isDone && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={10} className="text-ng" />
                    <span className="text-[9px] font-bold text-ng">Completed</span>
                  </div>
                )}
              </div>
              {isLocked && <Lock size={14} className="text-[var(--ft)] shrink-0" />}
            </div>
            {idx < LEVELS.length - 1 && (
              <div
                className={`w-[2px] h-3 ${
                  isDone ? 'bg-ng' : 'bg-[var(--bdr)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
