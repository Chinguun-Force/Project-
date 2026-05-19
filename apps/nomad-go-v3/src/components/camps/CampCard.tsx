import { Star, Lock } from 'lucide-react';
import type { AimagCamp } from '@/lib/data/aimags';

interface CampCardProps {
  camp: AimagCamp;
}

export default function CampCard({ camp }: CampCardProps) {
  return (
    <div className="ng-card p-2.5 flex items-center justify-between">
      <div className={camp.isBlurred ? 'blur-[5px] select-none pointer-events-none' : ''}>
        <p className="text-[13px] font-extrabold text-ng-tx">{camp.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {Array.from({ length: camp.rating }).map((_, i) => (
            <Star key={i} size={10} className="text-ny fill-ny" />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {camp.isBlurred ? (
          <button className="ng-pill bg-ny/10 text-ny border border-ny/30 flex items-center gap-1">
            <Lock size={10} />
            Unlock ★
          </button>
        ) : (
          <span className="text-[13px] font-extrabold text-ng-tx">
            ₮{camp.pricePerNight.toLocaleString()}
          </span>
        )}
        {!camp.isBlurred && (
          <span className="text-[10px] font-bold text-[var(--mu)]">per night</span>
        )}
      </div>
    </div>
  );
}
