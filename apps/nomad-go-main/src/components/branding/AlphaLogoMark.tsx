import { cn } from "@/lib/cn";

/** Monochrome mark for tinted / glass UI — set `className="text-white"` (or teal on light). */
export function AlphaLogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={cn(className)}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r="17.25"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity={0.92}
      />
      <path
        d="M20 8.5 L27.8 30 M20 8.5 L12.2 30 M14.2 22.5 H25.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
