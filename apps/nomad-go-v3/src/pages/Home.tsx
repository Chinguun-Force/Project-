import { motion } from 'framer-motion';
import HeroCanvas from '@/components/home/HeroCanvas';
import XPCard from '@/components/home/XPCard';
import CategoryScroll from '@/components/home/CategoryScroll';
import NearbyQuests from '@/components/home/NearbyQuests';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export default function Home() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <HeroCanvas />
      <XPCard />
      <CategoryScroll />
      <NearbyQuests />
    </motion.div>
  );
}
