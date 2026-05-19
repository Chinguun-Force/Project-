import { useState } from "react";
import { Camera, MapPin, HelpCircle, Hand, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";


interface QuestCardProps {
  id: string;
  title: string;
  description: string | null;
  basePoints: number;
  logicType: string;
  category: string;
  imageUrl: string | null;
  onComplete?: (result: {
    xpEarned: number;
    pointsEarned: number;
    levelsGained: number;
    newLevel: number;
    newRank: string;
    newMultiplier: number;
  }) => void;
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
  basePoints,
  logicType,
  category,
  imageUrl,
  onComplete,
}: QuestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);

  const completeMutation = {
    mutate: ({ questId }: { questId: string }) => {
      setCompleting(false);
      if (onComplete) {
        onComplete({
          xpEarned: 100,
          pointsEarned: 50,
          levelsGained: 0,
          newLevel: 1,
          newRank: "Nomad",
          newMultiplier: 1.0,
        });
      }
    }
  };

  const Icon = logicIcons[logicType] ?? Hand;
  const catColor = categoryColors[category] ?? categoryColors.global;
  const img = imageUrl ?? questImages[title] ?? "/quest-steppe.jpg";

  const handleComplete = () => {
    setCompleting(true);
    completeMutation.mutate({ questId: id });
  };

  return (
    <div className="bg-[#322F36] rounded-xl border border-[#322F36] hover:border-[#F4C64D]/30 transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#322F36] via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${catColor}`}
          >
            {category.replace("_", " ")}
          </span>
        </div>

        {/* Logic type icon */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 rounded-full bg-[#1A1D26]/80 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#F4C64D]" />
          </div>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white leading-tight">
            {title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Rewards row */}
        <div className="flex items-center gap-4 mb-3">
          
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#F4C64D]" />
            <span className="text-xs font-mono-data text-[#F4C64D]">
              {basePoints} pts
            </span>
          </div>
        </div>

        {/* Description (expandable) */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-40" : "max-h-0"
          }`}
        >
          <p className="text-sm text-[#A0A0B0] mb-3">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 bg-[#F4C64D] hover:bg-[#F4C64D]/90 text-[#1A1D26] font-semibold h-9"
          >
            {completing ? "Completing..." : "Complete Quest"}
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
      </div>
    </div>
  );
}
