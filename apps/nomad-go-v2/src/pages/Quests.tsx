import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
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

export default function Quests() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: quests, isLoading } = trpc.quest.list.useQuery();
  const { data: progress } = trpc.progress.me.useQuery(undefined, {
    enabled: !!user,
  });

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
  };

  const handleCalibrationComplete = () => {
    setShowCalibration(false);
    setCalibrationData(null);
  };

  const filteredQuests = quests?.filter((q) => {
    const matchesSearch =
      search === "" ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory =
      categoryFilter === "all" || q.category === categoryFilter;
    const matchesLogic =
      logicFilter === "all" || q.logicType === logicFilter;
    return matchesSearch && matchesCategory && matchesLogic;
  });

  return (
    <div className="min-h-screen bg-[#1A1D26] relative">
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
            <MapPin className="w-6 h-6 text-[#F4C64D]" />
            Quest Pool
          </h1>
          <p className="text-sm text-[#A0A0B0]">
            Complete quests to earn XP and points across Mongolia
          </p>
        </div>

        {/* Player Stats Bar */}
        {progress && (
          <div className="bg-[#322F36]/80 backdrop-blur-sm rounded-xl p-4 border border-[#322F36] mb-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <XPProgressBar
                current={progress.totalXp}
                max={progress.xpToNextLevel}
                level={progress.currentLevel}
              />
            </div>
            <div className="flex items-center gap-4">
              <EnergyCore points={progress.pointsBalance} size="sm" />
              <div className="text-right">
                <p className="text-xs text-[#A0A0B0]">Rank</p>
                <p className="text-sm font-bold text-[#F4C64D]">
                  {progress.currentRank}
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
              className="pl-10 bg-[#322F36] border-[#322F36] text-white placeholder:text-[#A0A0B0] focus:border-[#F4C64D]/50"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] bg-[#322F36] border-[#322F36] text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#322F36] border-[#322F36]">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-[#A8C69F]" />
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
              <SelectTrigger className="w-[140px] bg-[#322F36] border-[#322F36] text-white">
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
            {filteredQuests?.length ?? 0} quests available
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
              className="text-[#F4C64D] hover:text-[#F4C64D]/80 hover:bg-[#F4C64D]/10 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Quest Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#322F36] rounded-xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuests?.map((quest) => (
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
        )}

        {filteredQuests?.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-[#322F36] mx-auto mb-4" />
            <p className="text-lg text-[#A0A0B0] mb-2">No quests found</p>
            <p className="text-sm text-[#A0A0B0]">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
