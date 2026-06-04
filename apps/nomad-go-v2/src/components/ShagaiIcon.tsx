"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ShagaiIconSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_STYLES: Record<
  ShagaiIconSize,
  { box: string; zoom: string; sizes: string }
> = {
  xs: { box: "w-8 h-8", zoom: "scale-[2]", sizes: "32px" },
  sm: { box: "w-10 h-10", zoom: "scale-[2.05]", sizes: "40px" },
  md: { box: "w-14 h-14", zoom: "scale-[2.1]", sizes: "56px" },
  lg: { box: "w-[5.5rem] h-[5.5rem] sm:w-24 sm:h-24", zoom: "scale-[2.15]", sizes: "96px" },
  xl: { box: "w-32 h-32", zoom: "scale-[2.2]", sizes: "128px" },
};

type ShagaiIconProps = {
  className?: string;
  size?: ShagaiIconSize;
  /** When set, plays a flip animation whenever this value changes. */
  balance?: number;
  /** Extra glow / scale (e.g. after earning points). */
  highlight?: boolean;
};

export function ShagaiIcon({
  className,
  size = "md",
  balance,
  highlight,
}: ShagaiIconProps) {
  const [flipping, setFlipping] = useState(false);
  const prevBalance = useRef<number | undefined>(undefined);
  const hasMounted = useRef(false);
  const { box, zoom, sizes } = SIZE_STYLES[size];

  useEffect(() => {
    if (balance === undefined) return;

    if (!hasMounted.current) {
      hasMounted.current = true;
      prevBalance.current = balance;
      return;
    }

    if (prevBalance.current !== balance) {
      prevBalance.current = balance;
      setFlipping(true);
      const timer = window.setTimeout(() => setFlipping(false), 680);
      return () => window.clearTimeout(timer);
    }
  }, [balance]);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-visible",
        box,
        className,
        flipping && "animate-shagai-flip",
        highlight && !flipping && "scale-105 transition-transform duration-500",
      )}
      style={{ transformStyle: "preserve-3d" }}
      aria-hidden={balance !== undefined ? true : undefined}
    >
      <span
        // className={cn(
        //   "relative h-full w-full rounded-full",
        //   highlight
        //     ? "shadow-[0_0_24px_rgba(52,211,153,0.55)]"
        //     : "shadow-[0_0_14px_rgba(52,211,153,0.3)]",
        // )}
      >
        <Image
          src="/Shagai.png"
          alt={balance === undefined ? "Shagai" : ""}
          fill
          sizes={sizes}
          className={cn(
            "pointer-events-none select-none object-contain origin-center",
            zoom,
            highlight
              ? "drop-shadow-[0_0_18px_rgba(16,185,129,0.75)]"
              : "drop-shadow-[0_0_12px_rgba(52,211,153,0.45)]",
          )}
          priority={size === "lg" || size === "xl"}
        />
      </span>
    </span>
  );
}
