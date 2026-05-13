import { useEffect, useRef, useState } from "react";

interface XPProgressBarProps {
  current: number;
  max: number;
  level: number;
  isAnimating?: boolean;
}

export default function XPProgressBar({
  current,
  max,
  level,
  isAnimating = false,
}: XPProgressBarProps) {
  const [displayWidth, setDisplayWidth] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const prevCurrentRef = useRef(current);
  const percentage = Math.min(100, Math.round((current / max) * 100));

  useEffect(() => {
    // Animate width on mount or value change
    const timeout = setTimeout(() => {
      setDisplayWidth(percentage);
    }, 100);

    // Trigger glitch effect when XP increases
    if (current > prevCurrentRef.current) {
      setIsGlitching(true);
      const glitchTimeout = setTimeout(() => setIsGlitching(false), 300);
      return () => clearTimeout(glitchTimeout);
    }
    prevCurrentRef.current = current;

    return () => clearTimeout(timeout);
  }, [current, max, percentage]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#A8C69F] uppercase tracking-wider">
            XP
          </span>
          <span className="text-xs text-[#A0A0B0] font-mono-data">
            Lv.{level}
          </span>
        </div>
        <span className="text-xs text-[#A0A0B0] font-mono-data">
          {percentage}%
        </span>
      </div>
      <div className="relative w-full h-3 bg-[#322F36] rounded-full overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(168,198,159,0.1) 8px, rgba(168,198,159,0.1) 9px)",
          }}
        />
        {/* Fill bar */}
        <div
          className={`relative h-full rounded-full transition-all duration-700 ease-out ${
            isGlitching ? "animate-glitch" : ""
          } ${isAnimating ? "animate-pulse" : ""}`}
          style={{
            width: `${displayWidth}%`,
            background: "linear-gradient(90deg, #A8C69F 0%, #F4C64D 100%)",
            boxShadow:
              "0 0 10px rgba(168, 198, 159, 0.5), 0 0 20px rgba(244, 198, 77, 0.3)",
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
