"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Flame, MapPin, ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  getTouristActiveRoomAction,
  joinRoomByCodeAction,
  claimDailyCheckinAction,
  getUserProgressAction,
  completeRoomActivityAction,
} from "@/app/actions/gameActions";
import { setOfflineCache } from "@/lib/offline/idb";
import { toast } from "sonner";

import {
  computeOptimisticRewards,
  getMongolianRank,
} from "@/lib/gamification";
import { ShagaiIcon } from "@/components/ShagaiIcon";
import { LegacySessionMigrateBanner } from "@/components/LegacySessionMigrateBanner";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [activeExpedition, setActiveExpedition] = useState<any>(null);
  const [isLoadingExpedition, setIsLoadingExpedition] = useState(true);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [completingStepId, setCompletingStepId] = useState<string | null>(null);

  // Optimistic UI State
  const [localXp, setLocalXp] = useState(0); // Total XP (optional, but keep for history if needed)
  const [localCurrentXp, setLocalCurrentXp] = useState(0);
  const [localLevel, setLocalLevel] = useState(1);
  const [localXpThreshold, setLocalXpThreshold] = useState(1000);
  const [localShagai, setLocalShagai] = useState(0);
  const [isGlow, setIsGlow] = useState(false);
  const [floatingLabels, setFloatingLabels] = useState<{id: number, text: string}[]>([]);

  // Load User Progress native
  useEffect(() => {
    if (user && !isCheckingIn) {
      getUserProgressAction(user.id).then(data => {
        if (data) {
          setLocalXp(data.totalXp);
          setLocalCurrentXp(data.currentXp);
          setLocalShagai(data.pointsBalance);
          setLocalLevel(data.level);
          setLocalXpThreshold(data.xpThreshold);
        }
      });
    }
  }, [user, isCheckingIn]);

  const loadActiveExpedition = async () => {
    if (!user?.id) {
      setIsLoadingExpedition(false);
      return;
    }
    setIsLoadingExpedition(true);
    const roomId = user.user_metadata?.room_id as string | undefined;
    const data = await getTouristActiveRoomAction(user.id, roomId);
    setActiveExpedition(data);
    if (data) {
      try {
        await setOfflineCache(`room:${data.id}`, data);
      } catch {
        /* IndexedDB optional */
      }
    }
    setIsLoadingExpedition(false);
  };

  useEffect(() => {
    loadActiveExpedition();
  }, [user?.id, user?.user_metadata?.room_id]);

  const triggerRewardAnimation = (xpReward: number, shagaiReward: number) => {
    // 1. Instantly trigger smooth optimistic UI increments
    setLocalXp(prev => prev + xpReward);
    
    // Quick optimistic math for level up
    setLocalCurrentXp(prev => {
      let newCurrent = prev + xpReward;
      let newThreshold = localXpThreshold;
      let newLevel = localLevel;
      while (newCurrent >= newThreshold) {
        newCurrent -= newThreshold;
        newLevel++;
        newThreshold += 500;
      }
      if (newLevel > localLevel) {
        setLocalLevel(newLevel);
        setLocalXpThreshold(newThreshold);
      }
      return newCurrent;
    });

    setLocalShagai(prev => prev + shagaiReward);
    setIsGlow(true);

    // 2. Spawn the custom floating text nodes (+XP, +Shagai) near the profile card
    const id = Date.now();
    setFloatingLabels(prev => [
      ...prev,
      { id: id + 1, text: `+${xpReward} XP` },
      { id: id + 2, text: `+${shagaiReward} Shagai` }
    ]);

    setTimeout(() => setIsGlow(false), 1500);
    setTimeout(() => {
      setFloatingLabels(prev => prev.filter(l => l.id !== id + 1 && l.id !== id + 2));
    }, 1500);
  };

  const handleDailyCheckIn = async () => {
    if (!user || isCheckingIn) return;
    setIsCheckingIn(true);
    
    const baseXp = 10;
    const basePoints = 5;
    const { finalXpReward, finalPointReward } = computeOptimisticRewards(
      baseXp,
      basePoints,
      localLevel
    );

    triggerRewardAnimation(finalXpReward, finalPointReward);

    const res = await claimDailyCheckinAction(user.id);
    if (res.success) {
      // Re-fetch native data in background to stay synced
      getUserProgressAction(user.id).then(data => {
        if (data) {
          setLocalXp(data.totalXp);
          setLocalCurrentXp(data.currentXp);
          setLocalShagai(data.pointsBalance);
          setLocalLevel(data.level);
          setLocalXpThreshold(data.xpThreshold);
        }
      });
      router.refresh();
    } else {
      toast.error("Could not tend the fire. Please try again.");
      // Rollback on failure
      getUserProgressAction(user.id).then(data => {
        if (data) {
          setLocalXp(data.totalXp);
          setLocalCurrentXp(data.currentXp);
          setLocalShagai(data.pointsBalance);
          setLocalLevel(data.level);
          setLocalXpThreshold(data.xpThreshold);
        }
      });
    }
    setIsCheckingIn(false);
  };

  const handleMissionStepComplete = async (step: {
    id: string;
    xp_reward?: number;
    status?: string;
  }) => {
    if (!user || completingStepId || step.status === "completed") return;
    const baseXp = step.xp_reward || 0;
    if (baseXp <= 0) return;

    setCompletingStepId(step.id);
    const { finalXpReward, finalPointReward } = computeOptimisticRewards(
      baseXp,
      0,
      localLevel
    );
    triggerRewardAnimation(finalXpReward, finalPointReward);

    const res = await completeRoomActivityAction(user.id, step.id);
    if (res.success) {
      getUserProgressAction(user.id).then((data) => {
        if (data) {
          setLocalXp(data.totalXp);
          setLocalCurrentXp(data.currentXp);
          setLocalShagai(data.pointsBalance);
          setLocalLevel(data.level);
          setLocalXpThreshold(data.xpThreshold);
        }
      });
      setActiveExpedition((prev: typeof activeExpedition) => {
        if (!prev?.journey_days) return prev;
        return {
          ...prev,
          journey_days: prev.journey_days.map((day: { journey_steps?: { id: string; status?: string; xp_reward?: number }[] }) => ({
            ...day,
            journey_steps: day.journey_steps?.map((s) =>
              s.id === step.id ? { ...s, status: "completed", xp_reward: 0 } : s
            ),
          })),
        };
      });
      router.refresh();
    } else {
      toast.error("Could not complete mission step.");
      getUserProgressAction(user.id).then((data) => {
        if (data) {
          setLocalXp(data.totalXp);
          setLocalCurrentXp(data.currentXp);
          setLocalShagai(data.pointsBalance);
          setLocalLevel(data.level);
          setLocalXpThreshold(data.xpThreshold);
        }
      });
    }
    setCompletingStepId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">Nomad-Go</span>
          </h1>
          <button
            onClick={() => router.push("/login")}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3 rounded-xl transition-all"
          >
            Begin Your Journey
          </button>
        </div>
      </div>
    );
  }

  const currentTotalXp = localXp;
  const currentLevelRelativeXp = localCurrentXp;
  const currentLevel = localLevel;
  const currentRank = getMongolianRank(currentLevel);
  const availablePoints = localShagai;
  
  // Progress Bar Logic
  const percentage = Math.min(100, Math.max(0, (currentLevelRelativeXp / localXpThreshold) * 100));

  // Current journey day (default to Day 1 for timeline)
  const handleJoinExpedition = async () => {
    if (!user || isJoining || !roomCodeInput.trim()) return;
    setIsJoining(true);
    const res = await joinRoomByCodeAction(roomCodeInput);
    setIsJoining(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("You joined the expedition!");
    setRoomCodeInput("");
    router.refresh();
    await loadActiveExpedition();
  };

  const currentDay = activeExpedition?.journey_days?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-30px); opacity: 0; }
        }
        .animate-float-up {
          animation: floatUp 1.5s ease-out forwards;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LegacySessionMigrateBanner />

        {/* TOP SECTION: User Profile & Shagai Wallet */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col flex-1 max-w-sm mr-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={(user.user_metadata?.avatar_url as string) ?? "/rank-nomad.png"}
                  alt="avatar"
                  className="w-16 h-16 rounded-full border-2 border-border object-cover bg-card shadow-lg"
                  onError={(e) => { e.currentTarget.src = "/rank-nomad.png"; }}
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight line-clamp-1">
                  {(user.user_metadata?.playerName || user.user_metadata?.full_name || user.email?.split('@')[0]) ?? "Explorer"}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-semibold text-emerald-400 tracking-wide uppercase">
                    Lv.{currentLevel} • {currentRank}
                  </span>
                </div>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="w-full mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
                <span>{currentLevelRelativeXp.toLocaleString()} XP</span>
                <span>{localXpThreshold.toLocaleString()} XP</span>
              </div>
              <div className={`h-2 w-full bg-[#1F222A] rounded-full overflow-hidden transition-shadow duration-500 ${isGlow ? 'shadow-[0_0_20px_rgba(16,185,129,0.5)]' : ''}`}>
                <div 
                  className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-500 ease-out" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shagai Pill */}
          <div className={`relative bg-card border border-border rounded-2xl px-5 py-3 flex flex-col items-end transition-shadow duration-500 ${isGlow ? 'shadow-[0_0_20px_rgba(16,185,129,0.5)] border-emerald-500/50' : 'shadow-sm'}`}>
            
            {/* Floating Labels */}
            {floatingLabels.map((label, index) => (
              <div key={label.id} className="absolute -top-6 text-emerald-400 font-bold text-sm z-50 animate-float-up whitespace-nowrap" style={{ right: index === 0 ? '1rem' : '4rem', top: index === 0 ? '-1.5rem' : '-2.5rem' }}>
                {label.text}
              </div>
            ))}

            <div className="flex items-center gap-2 sm:gap-3">
              <ShagaiIcon
                size="lg"
                balance={availablePoints}
                highlight={isGlow}
              />
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tighter transition-all duration-500">
                {availablePoints.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">
              My Shagai
            </span>
          </div>
        </div>

        {/* MIDDLE SECTION: Road Blessing */}
        <div className="mb-10">
          <button 
            onClick={handleDailyCheckIn}
            disabled={isCheckingIn}
            className="w-full relative overflow-hidden group rounded-3xl bg-card border border-border p-6 md:p-8 flex items-center justify-between transition-all hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(52,211,153,0.1)] text-left disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                <Flame className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Road Blessing</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Tend your campfire daily to gain journey power and bonus rewards.
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center text-emerald-400 font-medium bg-emerald-500/10 px-4 py-2 rounded-full relative z-10 group-hover:bg-emerald-500/20 transition-colors">
              {isCheckingIn ? (
                <Spinner className="w-4 h-4 mr-2 text-emerald-400" />
              ) : (
                <>Tend Fire <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </div>
          </button>
        </div>

        {/* BOTTOM SECTION: Active Journey Hub */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Active Journey</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Current Journey */}
            <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6">
              {isLoadingExpedition ? (
                <div className="animate-pulse flex flex-col gap-4">
                  <div className="h-6 w-1/3 bg-muted rounded"></div>
                  <div className="h-4 w-1/4 bg-muted rounded"></div>
                  <div className="mt-6 space-y-4">
                    <div className="h-12 bg-muted rounded-xl"></div>
                    <div className="h-12 bg-muted rounded-xl"></div>
                  </div>
                </div>
              ) : activeExpedition ? (
                <div>
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{activeExpedition.name}</h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {activeExpedition.location || "Mongolia"}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-emerald-400/90 mt-1">
                        Room {activeExpedition.room_code}
                      </p>
                    </div>
                    <div className="bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Day {currentDay?.day_number || 1}
                    </div>
                  </div>

                  {/* Vertical Timeline */}
                  <div className="relative border-l-2 border-border ml-3 pl-6 space-y-8">
                    {!currentDay?.journey_steps || currentDay.journey_steps.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 italic">No steps scheduled for today.</p>
                    ) : (
                      currentDay.journey_steps.map((step: any) => (
                        <div key={step.id} className="relative group">
                          {/* Bullet point */}
                          <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-card bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                          
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                            <span className="font-mono text-sm font-bold text-emerald-400 w-20 shrink-0">
                              {step.time_slot}
                            </span>
                            <div>
                              <h4 className="font-semibold text-foreground text-lg">{step.title}</h4>
                              {step.description && (
                                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                  {step.description}
                                </p>
                              )}
                              {step.status === "in_progress" && step.xp_reward > 0 && (
                                <button
                                  type="button"
                                  disabled={completingStepId === step.id}
                                  onClick={() => handleMissionStepComplete(step)}
                                  className="mt-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {completingStepId === step.id
                                    ? "Completing…"
                                    : `Complete (+${step.xp_reward} XP)`}
                                </button>
                              )}
                              {step.status === "pending" && (
                                <p className="mt-2 text-xs text-muted-foreground italic">
                                  Waiting for your guide to start this stop
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <button 
                    onClick={() => router.push(`/tours/${activeExpedition.tripId}`)}
                    className="mt-8 w-full py-3 bg-muted hover:bg-emerald-500/10 hover:text-emerald-400 text-foreground text-sm font-medium rounded-xl transition-colors border border-transparent hover:border-emerald-500/20"
                  >
                    View Full Itinerary
                  </button>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-2">
                  <MapPin className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="font-semibold text-foreground text-lg mb-1">Join your expedition</p>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Enter the room code from your tour operator to unlock your live group itinerary.
                  </p>
                  <div className="flex w-full max-w-md gap-2 mb-4">
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="Expedition code"
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono uppercase tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      disabled={isJoining}
                    />
                    <button
                      type="button"
                      onClick={handleJoinExpedition}
                      disabled={isJoining || !roomCodeInput.trim()}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isJoining ? <Spinner className="w-4 h-4" /> : "Join"}
                    </button>
                  </div>
                  <button
                    onClick={() => router.push("/tours")}
                    className="text-sm text-muted-foreground hover:text-emerald-400 transition-colors"
                  >
                    Browse tour marketplace →
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Redeem Bridge */}
            <div className="lg:col-span-1">
              <button 
                onClick={() => router.push('/profile/redeem')}
                className="w-full h-full min-h-[250px] relative overflow-hidden group rounded-3xl bg-card border border-border p-6 flex flex-col items-center justify-center text-center transition-all hover:border-emerald-500/50"
              >
                <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="mb-6 relative z-10 flex items-center justify-center">
                    <div className="absolute w-32 h-32 bg-emerald-400 blur-2xl opacity-25 group-hover:opacity-45 transition-opacity rounded-full" />
                    <ShagaiIcon size="xl" className="relative z-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 leading-tight max-w-[200px]">
                    Redeem Shagai for Exclusive Rewards
                  </h3>
                  <div className="flex items-center text-sm font-medium text-emerald-400 bg-emerald-500/10 px-5 py-2 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                    Explore Rewards <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
