import { useState } from "react";
import { Camera, MapPin, HelpCircle, Hand, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import QuestExecutionCard from "@/components/QuestExecutionCard";
import type { QuestExecutionConfig } from "@/types/questExecution";

interface QuestCardProps {
  id: string;
  title: string;
  description: string | null;
  baseXp: number;
  basePoints: number;
  logicType: string;
  category: string;
  imageUrl: string | null;
  onComplete?: (payload: { baseXp: number; basePoints: number }) => void | Promise<void>;
  /** Called after quest engine persisted locally (sync already queued). */
  onExecutionComplete?: (payload: { baseXp: number; basePoints: number }) => void | Promise<void>;
  executionConfig?: QuestExecutionConfig | null;
  roomId?: string | null;
  userId?: string | null;
}

const logicIcons: Record<string, typeof Camera> = {
  photo: Camera,
  gps: MapPin,
  quiz: HelpCircle,
  manual: Hand,
};

const categoryColors: Record<string, string> = {
  daily: "bg-[#A8C69F]/20 text-[#A8C69F] border-[#A8C69F]/30",
  location_specific: "bg-[#F2994A]/20 text-[#F2994A] border-[#F2994A]/30",
  global: "bg-[#F4C64D]/20 text-[#F4C64D] border-[#F4C64D]/30",
};

const questImages: Record<string, string> = {
  "Walk 5km": "/quest-steppe.jpg",
  "Try Mongolian Dumplings": "/quest-dumplings.jpg",
  "GPS Check-in": "/quest-gps.jpg",
  "Photo Challenge": "/quest-terelj.jpg",
  "Naadam Festival": "/quest-naadam.jpg",
  "Ulaanbaatar Explorer": "/quest-ulanbaatar.jpg",
};

export default function QuestCard({
  id,
  title,
  description,
  baseXp,
  basePoints,
  logicType,
  category,
  imageUrl,
  onComplete,
  onExecutionComplete,
  executionConfig,
  roomId,
  userId,
}: QuestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showExecutor, setShowExecutor] = useState(false);
  const effectiveRoomId = roomId?.trim() || "global";
  const isInteractive = Boolean(executionConfig && userId);

  const Icon = logicIcons[logicType] ?? Hand;
  const catColor = categoryColors[category] ?? categoryColors.global;
  const img = imageUrl ?? questImages[title] ?? "/quest-steppe.jpg";

  const handleComplete = async () => {
    if (!onComplete || completing) return;
    setCompleting(true);
    try {
      await onComplete({ baseXp, basePoints });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="bg-[#322F36] rounded-xl border border-[#322F36] hover:border-[#F4C64D]/30 transition-all duration-300 overflow-hidden group">
      <div className="relative h-40 overflow-hidden">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#322F36] via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${catColor}`}
          >
            {category.replace("_", " ")}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 rounded-full bg-[#1A1D26]/80 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#F4C64D]" />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#A8C69F]" />
            <span className="text-xs font-mono-data text-[#A8C69F]">{baseXp} XP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#F4C64D]" />
            <span className="text-xs font-mono-data text-[#F4C64D]">{basePoints} Shagai</span>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-40" : "max-h-0"
          }`}
        >
          <p className="text-sm text-[#A0A0B0] mb-3">{description}</p>
        </div>

        {isInteractive && showExecutor && executionConfig && userId ? (
          <QuestExecutionCard
            questId={id}
            roomId={effectiveRoomId}
            userId={userId}
            title={title}
            config={executionConfig}
            className="mt-2"
            onSuccess={() => {
              setShowExecutor(false);
              setCompleting(true);
              const done = onExecutionComplete ?? onComplete;
              void Promise.resolve(
                done?.({ baseXp, basePoints })
              ).finally(() => setCompleting(false));
            }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                if (isInteractive) {
                  setShowExecutor(true);
                  setExpanded(true);
                } else {
                  void handleComplete();
                }
              }}
              disabled={completing}
              className="flex-1 bg-[#F4C64D] hover:bg-[#F4C64D]/90 text-[#1A1D26] font-semibold h-9"
            >
              {completing ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner className="w-4 h-4 text-[#1A1D26]" />
                </span>
              ) : isInteractive ? (
                "Execute Quest"
              ) : (
                "Complete Quest"
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-[#A0A0B0] hover:text-white hover:bg-[#1A1D26]/50 h-9 w-9 p-0"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
