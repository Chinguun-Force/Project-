import { Star, Lock } from 'lucide-react';
import type { AimagCamp } from '@/lib/data/aimags';

interface CampCardProps {
  camp: AimagCamp;
}

export default function CampCard({ camp }: CampCardProps) {
  return (
    <div className="bg-[#322F36] rounded-xl border border-[#322F36]/50 p-2.5 flex items-center justify-between">
      <div className={camp.isBlurred ? 'blur-[5px] select-none pointer-events-none' : ''}>
        <p className="text-[13px] font-extrabold text-white">{camp.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {Array.from({ length: camp.rating }).map((_, i) => (
            <Star key={i} size={10} className="text-[#F4C64D] fill-[#F4C64D]" />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {camp.isBlurred ? (
          <button className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4C64D]/10 text-[#F4C64D] border border-[#F4C64D]/30 flex items-center gap-1">
            <Lock size={10} />
            Unlock ★
          </button>
        ) : (
          <span className="text-[13px] font-extrabold text-white">
            ₮{camp.pricePerNight.toLocaleString()}
          </span>
        )}
        {!camp.isBlurred && (
          <span className="text-[10px] font-bold text-[#A0A0B0]">per night</span>
        )}
      </div>
    </div>
  );
}
