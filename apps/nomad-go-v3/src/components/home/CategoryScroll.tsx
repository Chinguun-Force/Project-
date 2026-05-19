import { useState } from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { label: 'All', icon: '🌏' },
  { label: 'Nature', icon: '🏔️' },
  { label: 'Ger Camp', icon: '⛺' },
  { label: 'Culture', icon: '🏛️' },
  { label: 'Horse', icon: '🐎' },
  { label: 'Food', icon: '🍖' },
  { label: 'Photo', icon: '📷' },
  { label: 'Gobi', icon: '🏜️' },
];

export default function CategoryScroll() {
  const [active, setActive] = useState('All');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="mt-4"
    >
      <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setActive(cat.label)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? 'bg-ng text-white border-ng shadow-md shadow-ng/20'
                  : 'bg-white text-[var(--tx2)] border-[var(--bdr)] hover:border-ng'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
