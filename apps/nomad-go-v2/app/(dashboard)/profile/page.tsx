"use client";
import { trpc } from "@/providers/trpc";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import XPProgressBar from "@/components/XPProgressBar";
import EnergyCore from "@/components/EnergyCore";
import {
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Calendar,
  Star,
  Target,
  Settings as SettingsIcon,
} from "lucide-react";

export default function Profile() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: progress } = trpc.progress.me.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: history } = trpc.quest.getUserCompletions.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: leaderboard } = trpc.progress.leaderboard.useQuery();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1D26]">
        <p className="text-[#A0A0B0]">Please login to view your profile</p>
      </div>
    );
  }

  const userRank =
    leaderboard?.findIndex((p: any) => p.userId === user.id) ?? -1;

  const displayName = (user.user_metadata?.playerName || user.user_metadata?.full_name || user.email?.split('@')[0]) ?? "Nomad";

  return (
    <div className="min-h-screen bg-[#1A1D26]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <Button
            variant="outline"
            onClick={() => router.push("/settings")}
            className="border-[#322F36] text-[#A0A0B0] hover:text-[#F4C64D] hover:border-[#F4C64D]/40 hover:bg-[#322F36]/50"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Profile Header */}
        <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={(user.user_metadata?.avatar_url as string) ?? "/rank-nomad.png"}
                alt="avatar"
                className="w-24 h-24 rounded-full border-4 border-[#F4C64D]/40 object-cover"
              />
              <div className="absolute -bottom-2 -right-2 bg-[#F4C64D] text-[#1A1D26] text-xs font-bold px-2.5 py-1 rounded-full">
                Lv.{progress?.currentLevel ?? 1}
              </div>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {displayName}
              </h2>
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <Award className="w-4 h-4 text-[#F4C64D]" />
                <span
                  className="text-lg font-semibold text-[#F4C64D]"
                  style={{
                    textShadow: "0 0 10px rgba(244, 198, 77, 0.3)",
                  }}
                >
                  {progress?.currentRank ?? "Nomad"}
                </span>
              </div>
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <span className="text-xs text-[#A0A0B0]">
                  {user.user_metadata?.role ? (user.user_metadata.role as string).charAt(0).toUpperCase() + (user.user_metadata.role as string).slice(1) : "User"}
                </span>
                <span className="text-xs text-[#A0A0B0]">
                  Joined{" "}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Recently"}
                </span>
                {userRank >= 0 && (
                  <span className="text-xs text-[#F4C64D]">
                    Rank #{userRank + 1} globally
                  </span>
                )}
              </div>
            </div>
            <EnergyCore
              points={progress?.pointsBalance ?? 0}
              size="lg"
            />
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] p-4 mb-6">
          <XPProgressBar
            current={progress?.totalXp ?? 0}
            max={progress?.xpToNextLevel ?? 300}
            level={progress?.currentLevel ?? 1}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#A8C69F]" />
              <span className="text-xs text-[#A0A0B0]">Level</span>
            </div>
            <span className="text-xl font-bold text-white font-mono-data">
              {progress?.currentLevel ?? 1}
            </span>
          </div>
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-[#F4C64D]" />
              <span className="text-xs text-[#A0A0B0]">Quests Done</span>
            </div>
            <span className="text-xl font-bold text-white font-mono-data">
              {progress?.questsCompleted ?? 0}
            </span>
          </div>
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#F2994A]" />
              <span className="text-xs text-[#A0A0B0]">Multiplier</span>
            </div>
            <span className="text-xl font-bold text-white font-mono-data">
              {progress?.multiplier ?? 1}x
            </span>
          </div>
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-[#F2994A]" />
              <span className="text-xs text-[#A0A0B0]">Streak</span>
            </div>
            <span className="text-xl font-bold text-white font-mono-data">
              {progress?.streakDays ?? 0}d
            </span>
          </div>
        </div>

        {/* Quest History */}
        <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] p-4">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#F4C64D]" />
            Quest History
          </h2>
          {history && history.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1A1D26]/50 hover:bg-[#1A1D26] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        h.xpEarned > 100
                          ? "bg-[#F4C64D]/20"
                          : "bg-[#A8C69F]/20"
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          h.xpEarned > 100
                            ? "text-[#F4C64D]"
                            : "text-[#A8C69F]"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Quest #{h.questId}
                      </p>
                      <p className="text-xs text-[#A0A0B0]">
                        {h.completedAt
                          ? new Date(h.completedAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono-data text-[#A8C69F]">
                      +{h.xpEarned} XP
                    </span>
                    <span className="text-xs font-mono-data text-[#F4C64D]">
                      +{h.pointsEarned} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-10 h-10 text-[#322F36] mx-auto mb-2" />
              <p className="text-sm text-[#A0A0B0]">
                No quests completed yet. Start exploring!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
