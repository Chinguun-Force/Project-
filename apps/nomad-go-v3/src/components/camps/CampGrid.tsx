import { motion } from 'framer-motion';
import type { AimagCamp } from '@/lib/data/aimags';
import CampCard from './CampCard';

interface CampGridProps {
  camps: AimagCamp[];
}

export default function CampGrid({ camps }: CampGridProps) {
  return (
    <div className="flex flex-col gap-2">
      {camps.map((camp, i) => (
        <motion.div
          key={camp.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.06 }}
        >
          <CampCard camp={camp} />
        </motion.div>
      ))}
    </div>
  );
}
