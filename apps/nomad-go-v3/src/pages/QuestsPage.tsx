import { useState } from 'react';
import { motion } from 'framer-motion';
import { QUESTS } from '@/lib/data/quests';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import QuestCard from '@/components/quests/QuestCard';
import QuestFilter from '@/components/quests/QuestFilter';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export default function QuestsPage() {
  const [filter, setFilter] = useState('all');
  const { completedQuestIds, level } = usePlayerStore();

  const filtered = QUESTS.filter((q) => {
    if (filter === 'all') return true;
    if (filter === 'done') return q.status === 'completed' || completedQuestIds.includes(q.id);
    return q.difficulty === filter;
  });

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="px-4 pt-4 pb-24">
      <h1 className="font-display text-[26px] font-black text-ng-tx mb-1">Quests</h1>
      <p className="text-[13px] text-[var(--mu)] mb-4">Complete real-world challenges to earn XP</p>

      <QuestFilter active={filter} onChange={setFilter} />

      <div className="flex flex-col gap-3">
        {filtered.map((quest, i) => {
          const isCompleted = completedQuestIds.includes(quest.id);
          const isLocked = quest.status === 'locked' || (quest.unlockLevel !== undefined && level < quest.unlockLevel);
          return (
            <QuestCard
              key={quest.id}
              quest={quest}
              index={i}
              isCompleted={isCompleted}
              isLocked={isLocked}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
