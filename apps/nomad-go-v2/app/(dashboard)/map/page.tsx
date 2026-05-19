"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Aimag } from '@/lib/data/aimags';
import MongoliaMap from '@/components/map/MongoliaMap';
import ProvincePanel from '@/components/map/ProvincePanel';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export default function MapPage() {
  const [selected, setSelected] = useState<Aimag | null>(null);
  const [viewMode, setViewMode] = useState<'aimag' | 'camp'>('aimag');

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pb-24">
      <div className="px-4 pt-4">
        <h1 className="font-display text-[26px] font-black text-white mb-1">Explore Map</h1>
        <p className="text-[13px] text-[#A0A0B0] mb-3">Tap an aimag to discover camps & quests</p>
      </div>

      {/* Toggle */}
      <div className="mx-4 mb-3 flex bg-[#322F36] rounded-full p-1 border border-[#322F36]/50">
        <button
          onClick={() => setViewMode('aimag')}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-full transition-all ${
            viewMode === 'aimag' ? 'bg-[#A8C69F] text-[#1A1D26] shadow-sm' : 'text-[#A0A0B0] hover:text-white'
          }`}
        >
          Аймаг
        </button>
        <button
          onClick={() => setViewMode('camp')}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-full transition-all ${
            viewMode === 'camp' ? 'bg-[#A8C69F] text-[#1A1D26] shadow-sm' : 'text-[#A0A0B0] hover:text-white'
          }`}
        >
          Кемп
        </button>
      </div>

      {/* Map container */}
      <div className="relative mx-4">
        <MongoliaMap selected={selected} onSelect={setSelected} viewMode={viewMode} />
        <ProvincePanel selected={selected} onClose={() => setSelected(null)} />
      </div>
    </motion.div>
  );
}
