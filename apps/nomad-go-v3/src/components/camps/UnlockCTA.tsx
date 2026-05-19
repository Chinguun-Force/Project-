import { Lock } from 'lucide-react';

export default function UnlockCTA() {
  return (
    <button className="ng-pill bg-ny/10 text-ny border border-ny/30 flex items-center gap-1">
      <Lock size={10} />
      Unlock ★ Premium
    </button>
  );
}
