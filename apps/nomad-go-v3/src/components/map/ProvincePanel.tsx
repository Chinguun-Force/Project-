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
          className="absolute top-2 right-2 left-2 bg-white rounded-[var(--r)] border border-[var(--bdr)] shadow-xl p-4 max-h-[320px] overflow-y-auto no-scrollbar"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-display text-[18px] font-black text-ng-tx">{selected.name}</h3>
              <p className="text-[11px] font-bold text-[var(--mu)]">{selected.nameEn}</p>
              <p className="text-[11px] text-[var(--ft)] mt-0.5">{selected.sub}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[var(--bg2)] transition-colors"
            >
              <X size={18} className="text-[var(--mu)]" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.tags.map((tag) => (
              <span key={tag} className="ng-pill bg-[var(--bg2)] text-[var(--tx2)] border border-[var(--bdr)]">
                {tag}
              </span>
            ))}
            <span className="ng-pill bg-ng-dim text-ng border border-ng-border">
              {selected.questCount} quests
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--mu)]">Nearby Camps</p>
            {selected.camps.map((camp) => (
              <CampCard key={camp.name} camp={camp} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
