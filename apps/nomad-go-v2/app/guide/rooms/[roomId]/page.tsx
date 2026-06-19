"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  getGuideRoomDetailAction,
  advanceRoomActivityAction,
  updateRoomActivityStatusAction,
  sendRoomReminderAction,
  type ActivityStatus,
} from "../../actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Globe,
  PlayCircle,
  Send,
} from "lucide-react";

const statusConfig: Record<
  ActivityStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  pending: { label: "Pending", icon: Circle, className: "text-[#A0A0B0]" },
  in_progress: {
    label: "In progress",
    icon: PlayCircle,
    className: "text-[#F2994A]",
  },
  completed: {
    label: "Done",
    icon: CheckCircle2,
    className: "text-[#A8C69F]",
  },
};

export default function GuideRoomTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<{
    id: string;
    room_code: string;
    status: string;
    trip_title: string;
  } | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reminder, setReminder] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getGuideRoomDetailAction(roomId);
      setRoom(data.room);
      setActivities(data.activities);
      setMissions(data.missions ?? []);
    } catch (e: any) {
      toast.error(e.message);
      router.push("/guide");
    } finally {
      setLoading(false);
    }
  }, [roomId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdvance = async (activityId: string) => {
    setBusyId(activityId);
    try {
      await advanceRoomActivityAction(activityId, roomId);
      await load();
      toast.success("Step updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSetStatus = async (activityId: string, status: ActivityStatus) => {
    setBusyId(activityId);
    try {
      await updateRoomActivityStatusAction(activityId, roomId, status);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSendReminder = async () => {
    const message = reminder.trim();
    if (!message || sendingReminder) return;
    setSendingReminder(true);
    try {
      const { delivered } = await sendRoomReminderAction(roomId, message);
      setReminder("");
      toast.success(
        delivered > 0
          ? `Reminder pushed to ${delivered} device${delivered === 1 ? "" : "s"}.`
          : "Reminder sent. No travelers have notifications on yet."
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="w-8 h-8 text-[#A8C69F]" />
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/guide"
        className="inline-flex items-center gap-1 text-sm text-[#A0A0B0] hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to rooms
      </Link>

      <div className="mb-8">
        <p className="font-mono text-[#A8C69F] font-bold text-lg">{room.room_code}</p>
        <h1 className="text-2xl font-bold text-white mt-1">{room.trip_title}</h1>
        <p className="text-sm text-[#A0A0B0] mt-1 capitalize">Room {room.status}</p>
      </div>

      {/* Push reminder / tip to the whole room */}
      <section className="mb-8 rounded-xl border border-[#322F36] bg-[#322F36]/40 p-4">
        <h2 className="text-sm font-semibold text-[#A0A0B0] uppercase tracking-wide mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-[#A8C69F]" />
          Send a tip to your travelers
        </h2>
        <textarea
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder="e.g. Bring water and a hat before the horse ride 🐎"
          className="w-full rounded-lg bg-[#1A1D26] border border-[#322F36] px-3 py-2 text-sm text-white placeholder:text-[#6b7280] focus:outline-none focus:border-[#A8C69F]/50 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-[#6b7280]">
            {reminder.length}/280 · Pushed to travelers with notifications on
          </span>
          <Button
            size="sm"
            disabled={sendingReminder || !reminder.trim()}
            onClick={handleSendReminder}
            className="bg-[#A8C69F] text-[#1A1D26] text-xs h-8 font-semibold"
          >
            {sendingReminder ? (
              <Spinner className="w-3 h-3" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1" />
                Send reminder
              </>
            )}
          </Button>
        </div>
      </section>

      {missions.length > 0 && (
        <section className="mb-8 rounded-xl border border-[#322F36] bg-[#322F36]/40 p-4">
          <h2 className="text-sm font-semibold text-[#A0A0B0] uppercase tracking-wide mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#A8C69F]" />
            Places for travelers (missions)
          </h2>
          <ul className="space-y-2">
            {missions.map((m) => (
              <li
                key={m.id}
                className="text-sm text-white bg-[#1A1D26]/60 rounded-lg px-3 py-2 flex justify-between gap-2"
              >
                <span>{m.title}</span>
                <span className="text-xs text-[#A0A0B0] shrink-0">
                  {(m.xp_reward ?? 0) > 0 ? `+${m.xp_reward} XP` : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#A0A0B0] mt-2">
            Tourists earn XP when they enter each sight radius.
          </p>
        </section>
      )}

      <h2 className="text-sm font-semibold text-[#A0A0B0] uppercase tracking-wide mb-4">
        Live timeline
      </h2>

      {activities.length === 0 ? (
        <p className="text-sm text-[#A0A0B0]">
          No activities in this room yet. The moderator may need to recreate the room from a template.
        </p>
      ) : (
        <ol className="space-y-3 border-l-2 border-[#322F36] ml-2 pl-6">
          {activities.map((a, index) => {
            const cfg = statusConfig[a.status as ActivityStatus] ?? statusConfig.pending;
            const Icon = cfg.icon;
            const isBusy = busyId === a.id;

            return (
              <li key={a.id} className="relative">
                <span className="absolute -left-[31px] top-3 w-3 h-3 rounded-full bg-[#322F36] border-2 border-[#1A1D26]" />
                <div className="rounded-xl border border-[#322F36] bg-[#322F36]/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs text-[#A0A0B0] font-mono">Step {index + 1}</span>
                      <p className="text-white font-medium mt-0.5">{a.name}</p>
                      <p className={`text-xs mt-2 flex items-center gap-1 ${cfg.className}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {a.status !== "completed" && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleAdvance(a.id)}
                        className="bg-[#A8C69F] text-[#1A1D26] text-xs h-8"
                      >
                        {isBusy ? (
                          <Spinner className="w-3 h-3" />
                        ) : a.status === "pending" ? (
                          "Start"
                        ) : (
                          "Complete"
                        )}
                      </Button>
                    )}
                    {a.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleSetStatus(a.id, "pending")}
                        className="border-[#322F36] text-[#A0A0B0] text-xs h-8"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
