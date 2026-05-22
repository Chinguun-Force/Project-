import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Volume2 } from "lucide-react";

interface RankCalibrationProps {
  oldRank: string;
  newRank: string;
  newLevel: number;
  newMultiplier: number;
  onComplete: () => void;
}

const rankImages: Record<string, string> = {
  Otgon: "/rank-nomad.png",
  Zamchin: "/rank-nomad.png",
  Aduuchin: "/rank-nomad.png",
  Nuudelchin: "/rank-great-khan.png",
  "Zam Medegch": "/rank-great-khan.png",
  "Talyn Khun": "/rank-great-khan.png",
  Suldetei: "/rank-great-khan.png",
  Noyon: "/rank-great-khan.png",
  Khan: "/rank-great-khan.png",
  Nomad: "/rank-nomad.png",
  Scout: "/rank-nomad.png",
};

export default function RankCalibration({
  oldRank,
  newRank,
  newLevel,
  newMultiplier,
  onComplete,
}: RankCalibrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slateRef = useRef<HTMLDivElement>(null);
  const goldRef = useRef<HTMLDivElement>(null);
  const crackRef = useRef<HTMLDivElement>(null);
  const bottomTierRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<
    "idle" | "shake" | "shatter" | "reveal" | "done"
  >("idle");

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("done");
        setTimeout(onComplete, 3000);
      },
    });

    // Phase 1: Fade in container
    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" }
    );

    // Phase 2: Shake & Crack
    tl.add(() => setPhase("shake"), 0.5);
    tl.to(
      slateRef.current,
      {
        x: "+=10",
        duration: 0.05,
        repeat: 39,
        yoyo: true,
        ease: "none",
      },
      0.5
    );

    // Energy crack appears
    tl.fromTo(
      crackRef.current,
      { opacity: 0, backgroundPosition: "0% 0%" },
      {
        opacity: 1,
        backgroundPosition: "100% 100%",
        duration: 2,
        ease: "power2.inOut",
      },
      0.5
    );

    // Phase 3: Shatter
    tl.add(() => setPhase("shatter"), 2.5);
    tl.to(
      slateRef.current,
      {
        scale: 1.5,
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
      },
      2.5
    );
    tl.to(
      crackRef.current,
      {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      },
      2.5
    );

    // Phase 4: Reveal gold rank
    tl.add(() => setPhase("reveal"), 3);
    tl.fromTo(
      goldRef.current,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
      },
      3
    );

    // Text reveal
    tl.fromTo(
      bottomTierRef.current?.children ?? [],
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
      },
      3.5
    );

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  const slateImg = rankImages[oldRank] ?? "/rank-nomad.png";
  const goldImg = rankImages[newRank] ?? "/rank-great-khan.png";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(26, 29, 38, 0.5) 0%, #1A1D26 70%)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Particle effects background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              background:
                i % 3 === 0
                  ? "#F4C64D"
                  : i % 3 === 1
                    ? "#A8C69F"
                    : "#F2994A",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
              animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Stage */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Top Tier - Current Stats */}
        <div className="flex items-center gap-4 opacity-60">
          <div className="px-4 py-2 rounded-full bg-[#322F36] border border-[#A8C69F]/30">
            <span className="text-xs text-[#A0A0B0] uppercase tracking-wider">
              Previous Rank
            </span>
            <p className="text-sm font-bold text-white">{oldRank}</p>
          </div>
          <Volume2 className="w-4 h-4 text-[#A0A0B0]" />
        </div>

        {/* Medallion Wrapper */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Old Rank (Slate) */}
          <div
            ref={slateRef}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 1 }}
          >
            <img
              src={slateImg}
              alt={oldRank}
              className="w-48 h-48 object-contain drop-shadow-2xl"
              style={{
                filter: "grayscale(0.3) brightness(0.7)",
              }}
            />
          </div>

          {/* Energy Crack Overlay */}
          <div
            ref={crackRef}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              opacity: 0,
              mixBlendMode: "color-dodge",
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(168, 198, 159, 0.8) 50%, rgba(244, 198, 77, 0.9) 70%, transparent 100%)",
            }}
          />

          {/* New Rank (Gold) */}
          <div
            ref={goldRef}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0, scale: "0.8" }}
          >
            <img
              src={goldImg}
              alt={newRank}
              className="w-56 h-56 object-contain"
              style={{
                filter: "drop-shadow(0 0 30px rgba(244, 198, 77, 0.6)) drop-shadow(0 0 60px rgba(244, 198, 77, 0.3))",
              }}
            />
            {/* Shine sweep */}
            {phase === "reveal" || phase === "done" ? (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)",
                  backgroundSize: "200% 200%",
                  animation: "shineSweep 2s ease-in-out",
                }}
              />
            ) : null}
          </div>
        </div>

        {/* Bottom Tier - New Stats */}
        <div
          ref={bottomTierRef}
          className="flex flex-col items-center gap-3"
        >
          <h2
            className="text-3xl font-black tracking-tight text-glow-gold"
            style={{ fontFamily: "Montserrat" }}
          >
            {newRank.toUpperCase()}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#A0A0B0]">Level {newLevel}</span>
            <span className="w-1 h-1 rounded-full bg-[#A0A0B0]" />
            <span
              className="text-lg font-bold text-[#F4C64D] font-mono-data"
              style={{
                textShadow: "0 0 15px rgba(244, 198, 77, 0.5)",
              }}
            >
              {newMultiplier}x Multiplier Unlocked!
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.2); }
        }
        @keyframes shineSweep {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
      `}</style>
    </div>
  );
}
