import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Aimag } from '@/lib/data/aimags';
import CampCard from '@/components/camps/CampCard';

interface ProvincePanelProps {
  selected: Aimag | null;
  onClose: () => void;
}

export default function ProvincePanel({ selected, onClose }: ProvincePanelProps) {
  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute top-2 right-2 left-2 bg-[#1A1D26] rounded-xl border border-[#322F36]/50 shadow-2xl p-4 max-h-[320px] overflow-y-auto no-scrollbar"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-display text-[18px] font-black text-white">{selected.name}</h3>
              <p className="text-[11px] font-bold text-[#A0A0B0]">{selected.nameEn}</p>
              <p className="text-[11px] text-[#A0A0B0]/80 mt-0.5">{selected.sub}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[#322F36] transition-colors"
            >
              <X size={18} className="text-[#A0A0B0]" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#322F36] text-white border border-[#322F36]/50">
                {tag}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A8C69F]/10 text-[#A8C69F] border border-[#A8C69F]/30">
              {selected.questCount} quests
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#A0A0B0]">Nearby Camps</p>
            {selected.camps.map((camp) => (
              <CampCard key={camp.name} camp={camp} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
