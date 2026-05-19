import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { QUESTS } from '@/lib/data/quests';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import QuestDetailView from '@/components/quests/QuestDetail';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export default function QuestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quest = QUESTS.find((q) => q.id === id);
  const { level, completedQuestIds, addXP, completeQuest } = usePlayerStore();

  if (!quest) {
    return (
      <div className="p-4 text-center text-[var(--mu)]">
        Quest not found.
        <button onClick={() => navigate('/quests')} className="block mt-4 text-ng font-bold">
          ← Back to Quests
        </button>
      </div>
    );
  }

  const isCompleted = completedQuestIds.includes(quest.id);
  const isLocked = quest.status === 'locked' || (quest.unlockLevel !== undefined && level < quest.unlockLevel);

  const handleComplete = () => {
    if (!isCompleted && !isLocked) {
      addXP(quest.xpReward);
      completeQuest(quest.id);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <QuestDetailView
        quest={quest}
        isCompleted={isCompleted}
        isLocked={isLocked}
        onComplete={handleComplete}
      />
    </motion.div>
  );
}
