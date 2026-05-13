import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Globe from "@/components/Globe";
import XPProgressBar from "@/components/XPProgressBar";
import EnergyCore from "@/components/EnergyCore";
import RankCalibration from "@/components/RankCalibration";
import FloatingGains from "@/components/FloatingGains";
import QuestCard from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Route,
  Trophy,
  Flame,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: progress } = trpc.progress.me.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: quests } = trpc.quest.list.useQuery();

  const seedMutation = trpc.progress.seed.useMutation({
    onSuccess: () => {
      utils.progress.me.invalidate();
    },
  });

  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationData, setCalibrationData] = useState<{
    oldRank: string;
    newRank: string;
    newLevel: number;
    newMultiplier: number;
  } | null>(null);

  const [floatingGains, setFloatingGains] = useState<{
    xp: number;
    points: number;
  } | null>(null);

  // Seed progress on first visit
  useEffect(() => {
    if (user && progress === undefined) {
      seedMutation.mutate();
    }
  }, [user, progress]);

  const handleQuestComplete = (result: {
    xpEarned: number;
    pointsEarned: number;
    levelsGained: number;
    newLevel: number;
    newRank: string;
    newMultiplier: number;
  }) => {
    setFloatingGains({
      xp: result.xpEarned,
      points: result.pointsEarned,
    });

    if (result.levelsGained > 0) {
      setCalibrationData({
        oldRank: progress?.currentRank ?? "Nomad",
        newRank: result.newRank,
        newLevel: result.newLevel,
        newMultiplier: result.newMultiplier,
      });
      setShowCalibration(true);
    }

    utils.progress.me.invalidate();
    utils.quest.getUserCompletions.invalidate();
  };

  const handleCalibrationComplete = () => {
    setShowCalibration(false);
    setCalibrationData(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1D26]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to <span className="text-[#F4C64D]">Nomad-Go</span>
          </h1>
          <p className="text-[#A0A0B0] mb-6">
            Your adventure across Mongolia begins here.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="bg-[#F4C64D] hover:bg-[#F4C64D]/90 text-[#1A1D26] font-semibold px-8 py-3"
          >
            Begin Your Journey
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* 3D Globe Background */}
      <div className="fixed inset-0 z-0 opacity-40">
        <Globe />
      </div>

      {/* Rank Calibration Overlay */}
      {showCalibration && calibrationData && (
        <RankCalibration
          oldRank={calibrationData.oldRank}
          newRank={calibrationData.newRank}
          newLevel={calibrationData.newLevel}
          newMultiplier={calibrationData.newMultiplier}
          onComplete={handleCalibrationComplete}
        />
      )}

      {/* Floating Gains */}
      {floatingGains && (
        <FloatingGains
          xpGained={floatingGains.xp}
          pointsGained={floatingGains.points}
        />
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Hero Stats Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left: Player Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img
                    src={user.avatar ?? "/rank-nomad.png"}
                    alt="avatar"
                    className="w-16 h-16 rounded-full border-2 border-[#F4C64D]/40 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F4C64D] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#1A1D26]">
                      {progress?.currentLevel ?? 1}
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {user.name ?? "Nomad"}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold text-[#F4C64D]"
                      style={{
                        textShadow: "0 0 10px rgba(244, 198, 77, 0.3)",
                      }}
                    >
                      {progress?.currentRank ?? "Nomad"}
                    </span>
                    <span className="text-xs text-[#A0A0B0]">
                      x{progress?.multiplier ?? 1} Multiplier
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Progress */}
              <div className="bg-[#322F36]/80 backdrop-blur-sm rounded-xl p-4 border border-[#322F36]">
                <XPProgressBar
                  current={progress?.totalXp ?? 0}
                  max={progress?.xpToNextLevel ?? 300}
                  level={progress?.currentLevel ?? 1}
                />
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="flex flex-row gap-4 items-start">
              <EnergyCore
                points={progress?.pointsBalance ?? 0}
                maxPoints={1000}
                size="lg"
              />
              <div className="flex flex-col gap-3">
                <div className="bg-[#322F36]/80 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-[#322F36]">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#F2994A]" />
                    <span className="text-xs text-[#A0A0B0]">Streak</span>
                  </div>
                  <span className="text-lg font-bold text-white font-mono-data">
                    {progress?.streakDays ?? 0}d
                  </span>
                </div>
                <div className="bg-[#322F36]/80 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-[#322F36]">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#F4C64D]" />
                    <span className="text-xs text-[#A0A0B0]">Quests</span>
                  </div>
                  <span className="text-lg font-bold text-white font-mono-data">
                    {progress?.questsCompleted ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => navigate("/quests")}
            className="bg-[#322F36]/80 backdrop-blur-sm rounded-xl p-4 border border-[#322F36] hover:border-[#F4C64D]/40 transition-all group text-left"
          >
            <MapPin className="w-6 h-6 text-[#A8C69F] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Quests</p>
            <p className="text-xs text-[#A0A0B0]">{quests?.length ?? 0} available</p>
          </button>
          <button
            onClick={() => navigate("/missions")}
            className="bg-[#322F36]/80 backdrop-blur-sm rounded-xl p-4 border border-[#322F36] hover:border-[#F4C64D]/40 transition-all group text-left"
          >
            <Route className="w-6 h-6 text-[#F2994A] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Missions</p>
            <p className="text-xs text-[#A0A0B0]">Explore locations</p>
          </button>
          <button
            onClick={() => navigate("/tours")}
            className="bg-[#322F36]/80 backdrop-blur-sm rounded-xl p-4 border border-[#322F36] hover:border-[#F4C64D]/40 transition-all group text-left"
          >
            <TrendingUp className="w-6 h-6 text-[#F4C64D] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Tour Plans</p>
            <p className="text-xs text-[#A0A0B0]">Curated journeys</p>
          </button>
          <button
            onClick={() => {
              utils.progress.me.invalidate();
            }}
            className="bg-[#322F36]/80 backdrop-blur-sm rounded-xl p-4 border border-[#322F36] hover:border-[#F4C64D]/40 transition-all group text-left"
          >
            <Flame className="w-6 h-6 text-[#A8C69F] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Daily Check-in</p>
            <p className="text-xs text-[#A0A0B0]">Claim bonus XP</p>
          </button>
        </div>

        {/* Featured Quests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#F4C64D]" />
              Active Quests
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate("/quests")}
              className="text-[#F4C64D] hover:text-[#F4C64D]/80 hover:bg-[#F4C64D]/10 text-sm"
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quests?.slice(0, 6).map((quest) => (
              <QuestCard
                key={quest.id}
                id={quest.id}
                title={quest.title}
                description={quest.description}
                baseXp={quest.baseXp}
                basePoints={quest.basePoints}
                logicType={quest.logicType}
                category={quest.category}
                imageUrl={quest.imageUrl}
                onComplete={handleQuestComplete}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
