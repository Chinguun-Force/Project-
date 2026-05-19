"use client";
import { useEffect, useState } from "react";
import { getToursAction } from "@/app/actions/gameActions";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Clock,
  TrendingUp,
  Star,
  Route,
  Zap,
  ChevronRight,
  Plus,
} from "lucide-react";

interface TourPlan {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  difficulty: string;
  totalXp: number;
  estimatedDuration: number;
  missionsCount: number;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-[#A8C69F]/20 text-[#A8C69F] border-[#A8C69F]/30",
  medium: "bg-[#F2994A]/20 text-[#F2994A] border-[#F2994A]/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const tourImages: Record<number, string> = {
  1: "/quest-steppe.jpg",
  2: "/quest-terelj.jpg",
  3: "/quest-ulanbaatar.jpg",
  4: "/quest-naadam.jpg",
  5: "/quest-gps.jpg",
  6: "/quest-dumplings.jpg",
};

  export default function TourPlansPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tours, setTours] = useState<TourPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      setIsLoading(true);
      const plans = await getToursAction();
      setTours(plans);
      setIsLoading(false);
    };

    fetchTours();
  }, []);

  const isModerator =
    user?.user_metadata?.role === "moderator" ||
    user?.user_metadata?.role === "admin";

  return (
    <div className="min-h-screen bg-[#1A1D26]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#F4C64D]" />
              Tour Plans
            </h1>
            <p className="text-sm text-[#A0A0B0]">
              Curated expedition routes across Mongolia
            </p>
          </div>
          {isModerator && (
            <Button
              onClick={() => router.push("/tours/create")}
              className="bg-[#F4C64D] hover:bg-[#F4C64D]/90 text-[#1A1D26] font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Tour
            </Button>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-1">
              <Route className="w-4 h-4 text-[#A8C69F]" />
              <span className="text-xs text-[#A0A0B0]">Total Tours</span>
            </div>
            <span className="text-2xl font-bold text-white font-mono-data">
              {tours.length}
            </span>
          </div>
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-[#F4C64D]" />
              <span className="text-xs text-[#A0A0B0]">Avg XP</span>
            </div>
            <span className="text-2xl font-bold text-white font-mono-data">
              {tours.length > 0
                ? Math.round(tours.reduce((a, p) => a + p.totalXp, 0) / tours.length)
                : 0}
            </span>
          </div>
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#F2994A]" />
              <span className="text-xs text-[#A0A0B0]">Difficulty</span>
            </div>
            <span className="text-2xl font-bold text-white font-mono-data">
              Mixed
            </span>
          </div>
        </div>

        {/* Tour Plan Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#322F36] rounded-xl h-64 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tours.map((plan, idx) => (
              <div
                key={plan.id}
                className="bg-[#322F36] rounded-xl border border-[#322F36] hover:border-[#F4C64D]/30 transition-all overflow-hidden group cursor-pointer"
                onClick={() => router.push(`/tours/${plan.id}`)}
              >
                {/* Image Header */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={plan.imageUrl}
                    alt={plan.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#322F36] via-transparent to-transparent" />

                  {/* Difficulty Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                        difficultyColors[plan.difficulty] ??
                        difficultyColors.medium
                      }`}
                    >
                      {plan.difficulty}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {plan.title}
                    </h3>
                    <p className="text-sm text-[#A0A0B0] line-clamp-1">
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#F4C64D]" />
                        <span className="text-xs font-mono-data text-[#F4C64D]">
                          {plan.totalXp} XP
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#A0A0B0]" />
                        <span className="text-xs text-[#A0A0B0]">
                          {plan.estimatedDuration}h
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[#A8C69F]" />
                        <span className="text-xs text-[#A8C69F]">
                          {plan.missionsCount} Missions
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A0A0B0] group-hover:text-[#F4C64D] transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tours.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-[#322F36] mx-auto mb-4" />
            <p className="text-lg text-[#A0A0B0] mb-2">
              No tour plans available yet
            </p>
            {isModerator && (
              <Button
                onClick={() => router.push("/tours/create")}
                variant="outline"
                className="mt-4 border-[#F4C64D] text-[#F4C64D] hover:bg-[#F4C64D]/10"
              >
                Create the first tour plan
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
