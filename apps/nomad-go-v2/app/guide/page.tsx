"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getGuideAssignedRoomsAction, getGuideContextAction } from "./actions";
import { Spinner } from "@/components/ui/spinner";
import { MapPin, ChevronRight } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "text-[#A8C69F]",
  archived: "text-[#A0A0B0]",
};

export default function GuideDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [guideName, setGuideName] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ctx = await getGuideContextAction();
        setGuideName(ctx.fullName);
        const data = await getGuideAssignedRoomsAction();
        setRooms(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="w-8 h-8 text-[#A8C69F]" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-7 h-7 text-[#A8C69F]" />
          My assigned rooms
        </h1>
        <p className="text-[#A0A0B0] mt-1 text-sm">
          {guideName ? `Hello, ${guideName}` : "Field guide"} — run the live tour timeline for each group.
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#322F36] p-10 text-center">
          <p className="text-white font-medium">No rooms assigned yet</p>
          <p className="text-sm text-[#A0A0B0] mt-2">
            Ask your company moderator to create a room and assign you as the guide.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rooms.map((room) => {
            const { total, completed } = room.progress ?? { total: 0, completed: 0 };
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <li key={room.id}>
                <Link
                  href={`/guide/rooms/${room.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[#322F36] bg-[#322F36]/50 px-4 py-4 hover:border-[#A8C69F]/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[#A8C69F] font-bold">{room.room_code}</p>
                    <p className="text-white text-sm mt-1 truncate">{room.trip_title}</p>
                    <p className={`text-xs mt-1 capitalize ${statusColors[room.status] ?? "text-[#A0A0B0]"}`}>
                      {room.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[#A0A0B0]">Progress</p>
                      <p className="text-sm font-semibold text-white">
                        {completed}/{total} · {pct}%
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#A0A0B0]" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
