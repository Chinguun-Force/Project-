"use client";
import { useState, useEffect } from "react";
import { getQuestsAction, getMissionsAction } from "@/app/actions/gameActions";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { useGeolocation, MissionLocation } from "@/hooks/useGeolocation";
import QuestCard from "@/components/QuestCard";
import XPProgressBar from "@/components/XPProgressBar";
import EnergyCore from "@/components/EnergyCore";
import RankCalibration from "@/components/RankCalibration";
import FloatingGains from "@/components/FloatingGains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
  Filter,
  Globe,
  Calendar,
  Sparkles,
} from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  basePoints: number;
  logicType: string;
  category: string;
  imageUrl: string;
  isCompleted: boolean;
  isCasual: boolean;
  missionId: string | null;
}

export default function Quests() {
  const { user } = useAuth();
  const { userStats, completeQuest, refreshStats } = useUserStats();
  const supabase = createClient();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [missions, setMissions] = useState<MissionLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { coords, activeMissionId } = useGeolocation(missions);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [logicFilter, setLogicFilter] = useState<string>("all");

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

  useEffect(() => {
    const fetchQuestsAndMissions = async () => {
      if (!userStats?.id) return;
      setIsLoading(true);

      const sessionId = userStats.sessionId;
      
      const [rawQuests, rawMissions, userQuestsRes] = await Promise.all([
        getQuestsAction(),
        getMissionsAction(),
        supabase.from("user_quests").select("quest_id").eq("user_id", userStats.id)
      ]);

      const completedIds = new Set(userQuestsRes.data?.map(uq => uq.quest_id) || []);

      const sessionMissions = rawMissions.filter(m => !m.session_id || m.session_id === sessionId);
      const availableQuests = rawQuests.filter(q => 
        q.status === "available" && (!q.session_id || q.session_id === sessionId)
      );

      setMissions(sessionMissions.map(m => ({
        id: m.id,
        latitude: m.latitude,
        longitude: m.longitude,
        radiusMeters: m.radius_meters || 50
      })));

      setQuests(availableQuests.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description || "",
        baseXp: q.xp_reward || 100,
        basePoints: q.point_reward || 50,
        logicType: q.type || "manual",
        category: q.category || "global",
        imageUrl: q.image_url || "/quest-steppe.jpg",
        isCompleted: completedIds.has(q.id),
        isCasual: q.is_casual !== false,
        missionId: q.mission_id,
      })));
      
      setIsLoading(false);
    };

    fetchQuestsAndMissions();
  }, [userStats?.id, userStats?.sessionId, supabase]);

  const handleQuestComplete = async (result: {
    xpEarned: number;
    pointsEarned: number;
    levelsGained: number;
    newLevel: number;
    newRank: string;
    newMultiplier: number;
    questId: string;
    responseData?: any;
  }) => {
    // Write to DB
    await completeQuest(result.questId, result.pointsEarned, result.responseData);
    
    // UI Updates
    setQuests(quests.map(q => q.id === result.questId ? { ...q, isCompleted: true } : q));

    setFloatingGains({
      xp: result.xpEarned,
      points: result.pointsEarned,
    });

    if (result.levelsGained > 0) {
      setCalibrationData({
        oldRank: "Nomad", // simplified for now
        newRank: result.newRank,
        newLevel: result.newLevel,
        newMultiplier: result.newMultiplier,
      });
      setShowCalibration(true);
    }

    refreshStats();
  };

  const handleCalibrationComplete = () => {
    setShowCalibration(false);
    setCalibrationData(null);
  };

  const filteredQuests = quests?.map((q) => {
    // Visibility Check based on strict Geofencing Rules
    let isVisible = true;
    
    // 1. Render if quest.is_casual === true
    // 2. OR render if quest.is_casual === false && quest.mission_id === activeMissionId
    if (!q.isCasual) {
      if (q.missionId !== activeMissionId) {
        isVisible = false;
      }
    }

    const matchesSearch =
      search === "" ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    const matchesCategory =
      categoryFilter === "all" || q.category === categoryFilter;
    
    const matchesLogic =
      logicFilter === "all" || q.logicType === logicFilter;
    
    if (!matchesSearch || !matchesCategory || !matchesLogic || q.isCompleted) {
      isVisible = false;
    }

    return { ...q, isVisible };
  });

  const visibleCount = filteredQuests.filter(q => q.isVisible).length;

  return (
    <div className="min-h-screen bg-[#1A1D26] relative overflow-hidden">
      {/* Overlays */}
      {showCalibration && calibrationData && (
        <RankCalibration
          oldRank={calibrationData.oldRank}
          newRank={calibrationData.newRank}
          newLevel={calibrationData.newLevel}
          newMultiplier={calibrationData.newMultiplier}
          onComplete={handleCalibrationComplete}
        />
      )}
      {floatingGains && (
        <FloatingGains
          xpGained={floatingGains.xp}
          pointsGained={floatingGains.points}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#10B981]" />
            Quest Pool
          </h1>
          <p className="text-sm text-[#A0A0B0]">
            Complete quests to earn XP and points across Mongolia
          </p>
        </div>

        {/* Player Stats Bar */}
        {userStats && (
          <div className="bg-[#322F36]/80 backdrop-blur-sm rounded-xl p-4 border border-[#322F36] mb-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <XPProgressBar
                current={userStats.currentXp ?? 0}
                max={userStats.xpThreshold ?? 1000}
                level={userStats.level ?? 1}
              />
            </div>
            <div className="flex items-center gap-4">
              <EnergyCore points={userStats.points ?? 0} size="sm" />
              <div className="text-right">
                <p className="text-xs text-[#A0A0B0]">Rank</p>
                <p className="text-sm font-bold text-[#10B981]">
                  Level {userStats.level ?? 1}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0B0]" />
            <Input
              placeholder="Search quests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#322F36] border-[#322F36] text-white placeholder:text-[#A0A0B0] focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] bg-[#322F36] border-[#322F36] text-white focus:ring-[#10B981]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#322F36] border-[#322F36]">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-[#10B981]" />
                    Daily
                  </div>
                </SelectItem>
                <SelectItem value="location_specific">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-[#F2994A]" />
                    Location
                  </div>
                </SelectItem>
                <SelectItem value="global">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-[#F4C64D]" />
                    Global
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={logicFilter} onValueChange={setLogicFilter}>
              <SelectTrigger className="w-[140px] bg-[#322F36] border-[#322F36] text-white focus:ring-[#10B981]">
                <Sparkles className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#322F36] border-[#322F36]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="photo">Photo</SelectItem>
                <SelectItem value="gps">GPS</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#A0A0B0]">
            {visibleCount} quests available
          </p>
          {(categoryFilter !== "all" || logicFilter !== "all" || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter("all");
                setLogicFilter("all");
                setSearch("");
              }}
              className="text-[#10B981] hover:text-[#10B981]/80 hover:bg-[#10B981]/10 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Quest Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#322F36] rounded-2xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative min-h-[500px]">
            {filteredQuests?.map((quest) => (
              <div 
                key={quest.id} 
                className={`transition-all duration-500 ease-in-out origin-top ${
                  quest.isVisible 
                    ? 'opacity-100 scale-100 h-auto mb-4' 
                    : 'opacity-0 scale-95 h-0 overflow-hidden m-0 p-0 pointer-events-none absolute'
                }`}
              >
                <QuestCard
                  id={quest.id}
                  title={quest.title}
                  description={quest.description}
                  basePoints={quest.basePoints}
                  logicType={quest.logicType}
                  category={quest.category}
                  imageUrl={quest.imageUrl}
                  onComplete={(res) => handleQuestComplete({ ...res, questId: quest.id })}
                />
              </div>
            ))}
          </div>
        )}

        {visibleCount === 0 && !isLoading && (
          <div className="text-center py-16 bg-[#322F36]/20 rounded-2xl border border-[#322F36]/50">
            <MapPin className="w-12 h-12 text-[#322F36] mx-auto mb-4" />
            <p className="text-lg text-white mb-2">No active quests found</p>
            <p className="text-sm text-[#A0A0B0]">
              Get closer to a mission location or check your filters!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
