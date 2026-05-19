import { BADGES } from '@/lib/data/badges';

interface BadgeShelfProps {
  earnedBadgeIds: string[];
}

export default function BadgeShelf({ earnedBadgeIds }: BadgeShelfProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BADGES.map((badge) => {
        const earned = earnedBadgeIds.includes(badge.id);
        return (
          <div
            key={badge.id}
            className={`ng-card p-2 flex flex-col items-center text-center ${earned ? '' : 'opacity-35'}`}
          >
            <div className="text-2xl mb-1">{badge.icon}</div>
            <p className="text-[10px] font-bold text-ng-tx leading-tight">{badge.name}</p>
            <p className="text-[9px] text-[var(--ft)] mt-0.5">Lv.{badge.unlockLevel}</p>
          </div>
        );
      })}
    </div>
  );
}
