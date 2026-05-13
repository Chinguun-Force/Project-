import { useEffect, useState } from "react";

interface FloatingParticle {
  id: number;
  value: string;
  x: number;
  color: string;
  delay: number;
}

interface FloatingGainsProps {
  xpGained: number;
  pointsGained: number;
  originX?: number;
  originY?: number;
}

export default function FloatingGains({
  xpGained,
  pointsGained,
  originX = 50,
  originY = 50,
}: FloatingGainsProps) {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const newParticles: FloatingParticle[] = [];
    let id = 0;

    // Create XP particles
    for (let i = 0; i < Math.min(3, Math.ceil(xpGained / 50)); i++) {
      newParticles.push({
        id: id++,
        value: `+${Math.ceil(xpGained / Math.min(3, Math.ceil(xpGained / 50)))} XP`,
        x: originX + (Math.random() - 0.5) * 20,
        color: "#A8C69F",
        delay: i * 0.15,
      });
    }

    // Create Points particles
    for (let i = 0; i < Math.min(2, Math.ceil(pointsGained / 25)); i++) {
      newParticles.push({
        id: id++,
        value: `+${Math.ceil(pointsGained / Math.min(2, Math.ceil(pointsGained / 25)))} pts`,
        x: originX + (Math.random() - 0.5) * 20 + 10,
        color: "#F4C64D",
        delay: 0.3 + i * 0.15,
      });
    }

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [xpGained, pointsGained, originX]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[80]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute font-bold font-mono-data text-sm"
          style={{
            left: `${p.x}%`,
            top: `${originY}%`,
            color: p.color,
            textShadow: `0 0 10px ${p.color}80, 0 0 20px ${p.color}40`,
            animation: `floatUpAndFade 1.5s ease-out forwards`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        >
          {p.value}
        </div>
      ))}
      <style>{`
        @keyframes floatUpAndFade {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(-40px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(0.6);
          }
        }
      `}</style>
    </div>
  );
}
