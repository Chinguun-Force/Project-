interface AvatarRingProps {
  level: number;
  avatar?: string;
}

export default function AvatarRing({ level, avatar = '🧭' }: AvatarRingProps) {
  return (
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-[var(--bg2)] border-[3px] border-ng flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(0,200,74,0.25)]">
        {avatar}
      </div>
      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ng text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-white">
        {level}
      </div>
    </div>
  );
}
