import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface EnergyCoreProps {
  points: number;
  maxPoints?: number;
  size?: "sm" | "md" | "lg";
}

export default function EnergyCore({
  points,
  maxPoints = 1000,
  size = "md",
}: EnergyCoreProps) {
  const [animatedFill, setAnimatedFill] = useState(0);
  const percentage = Math.min(100, (points / maxPoints) * 100);

  const sizeMap = {
    sm: { w: 48, font: "text-[10px]", icon: 14 },
    md: { w: 64, font: "text-xs", icon: 18 },
    lg: { w: 80, font: "text-sm", icon: 22 },
  };

  const s = sizeMap[size];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedFill(percentage);
    }, 300);
    return () => clearTimeout(timeout);
  }, [percentage]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: s.w,
          height: s.w,
          border: "2px solid #A8C69F",
          background: "#1A1D26",
          boxShadow: "0 0 15px rgba(168, 198, 159, 0.2)",
        }}
      >
        {/* Conic gradient fill */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            background: `conic-gradient(from 0deg, #F4C64D ${animatedFill * 3.6}deg, transparent ${animatedFill * 3.6}deg)`,
            opacity: 0.6,
          }}
        />
        {/* Inner dark circle */}
        <div
          className="absolute rounded-full bg-[#1A1D26] flex items-center justify-center"
          style={{
            width: s.w - 12,
            height: s.w - 12,
          }}
        >
          <div className="flex flex-col items-center">
            <Zap
              className="text-[#F4C64D] mb-0.5"
              size={s.icon}
              style={{
                filter: "drop-shadow(0 0 4px rgba(244, 198, 77, 0.5))",
              }}
            />
            <span
              className={`${s.font} font-bold text-white font-mono-data`}
              style={{
                textShadow: "0 0 8px rgba(244, 198, 77, 0.5)",
              }}
            >
              {points}
            </span>
          </div>
        </div>
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full animate-pulse-glow pointer-events-none"
          style={{
            boxShadow:
              animatedFill > 80
                ? "0 0 20px rgba(244, 198, 77, 0.6), inset 0 0 20px rgba(244, 198, 77, 0.2)"
                : "none",
          }}
        />
      </div>
      <span className="text-[10px] text-[#A0A0B0] uppercase tracking-wider font-medium">
        Fuel
      </span>
    </div>
  );
}
