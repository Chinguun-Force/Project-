import { motion } from 'framer-motion';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export default function Topbar() {
  const { level, totalXP } = usePlayerStore();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full backdrop-blur-md bg-[rgba(245,243,238,0.85)] border-b border-[var(--bdr)]"
    >
      <div className="max-w-[430px] mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-display text-lg font-black text-ng tracking-tight">Nomad</span>
          <span className="font-display text-lg font-black text-ng-tx tracking-tight">Go</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-ng bg-ng-dim px-2 py-1 rounded-full">
            ⚡ Lv.{level} · {totalXP.toLocaleString()} XP
          </span>
          <div className="flex gap-1 text-[10px] font-bold text-[var(--mu)]">
            <span className="px-1.5 py-0.5 rounded bg-[var(--bg3)]">EN</span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--bg3)]">MN</span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--bg3)]">KR</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
