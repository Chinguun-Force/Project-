"use client";

import { useEffect, useRef, useState } from "react";
import { getLevelFromXp } from "@/lib/xp";
import { useGameStore } from "@/store/useGameStore";

type Pop = { id: number; text: string; left: string; top: string };

export function XpLevelEffects() {
  const xp = useGameStore((s) => s.user.xp);
  const level = getLevelFromXp(xp);
  const prevXp = useRef<number | null>(null);
  const prevLevel = useRef<number | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevXp.current === null) {
      prevXp.current = xp;
      prevLevel.current = level;
      return;
    }

    const delta = xp - prevXp.current;
    if (delta > 0) {
      const id = Date.now() + Math.random();
      const left = `${18 + Math.random() * 52}%`;
      const top = `${22 + Math.random() * 28}%`;
      setPops((p) => [...p, { id, text: `+${delta} XP`, left, top }]);
      window.setTimeout(() => {
        setPops((p) => p.filter((t) => t.id !== id));
      }, 2300);
    }

    if (prevLevel.current !== null && level > prevLevel.current) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 700);
    }

    prevXp.current = xp;
    prevLevel.current = level;
  }, [xp, level]);

  return (
    <>
      {flash ? (
        <div
          className="pointer-events-none fixed inset-0 z-[45] animate-level-flash bg-gradient-to-b from-teal-200/25 via-amber-100/15 to-transparent"
          aria-hidden
        />
      ) : null}
      <div className="pointer-events-none fixed inset-0 z-[44] overflow-hidden" aria-hidden>
        {pops.map((p) => (
          <div
            key={p.id}
            className="animate-xp-pop absolute text-sm font-semibold tracking-tight text-teal-800 drop-shadow-sm"
            style={{ left: p.left, top: p.top }}
          >
            {p.text}
          </div>
        ))}
      </div>
    </>
  );
}
