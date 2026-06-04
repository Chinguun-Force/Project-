"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getModeratorDashboardStatsAction,
  getModeratorContextAction,
} from "./actions";
import { Users, Map, DoorOpen, UserCog } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function ModeratorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    companyName: string | null;
    guides: number;
    moderators: number;
    tripTemplates: number;
    rooms: number;
    activeRooms: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await getModeratorContextAction();
        const data = await getModeratorDashboardStatsAction();
        setStats(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="w-8 h-8 text-[#F4C64D]" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-red-400 text-sm">{error}</p>
    );
  }

  const cards = [
    {
      label: "Guides",
      value: stats?.guides ?? 0,
      icon: Users,
      href: "/moderator/team",
      color: "text-[#A8C69F]",
    },
    {
      label: "Tour templates",
      value: stats?.tripTemplates ?? 0,
      icon: Map,
      href: "/moderator/templates",
      color: "text-[#F4C64D]",
    },
    {
      label: "Active rooms",
      value: stats?.activeRooms ?? 0,
      icon: DoorOpen,
      href: "/moderator/rooms",
      color: "text-[#F2994A]",
    },
    {
      label: "Staff (moderators)",
      value: stats?.moderators ?? 0,
      icon: UserCog,
      href: "/moderator/team",
      color: "text-[#A0A0B0]",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-[#A0A0B0] mt-1 text-sm md:text-base">
          {stats?.companyName
            ? `Overview for ${stats.companyName}`
            : "Company overview"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-[#322F36] bg-[#322F36]/50 p-4 hover:border-[#F4C64D]/40 transition-colors"
          >
            <c.icon className={`w-5 h-5 mb-2 ${c.color}`} />
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-[#A0A0B0] mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-[#322F36] bg-[#322F36]/40 p-5 text-sm text-[#A0A0B0] space-y-2">
        <p className="font-semibold text-white">How your workflow fits together</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <Link href="/moderator/templates" className="text-[#F4C64D] hover:underline">
              Tour templates
            </Link>{" "}
            — master trip + activity sequence (blueprint).
          </li>
          <li>
            <Link href="/moderator/team" className="text-[#F4C64D] hover:underline">
              Team
            </Link>{" "}
            — hire guides for your company.
          </li>
          <li>
            <Link href="/moderator/rooms" className="text-[#F4C64D] hover:underline">
              Rooms
            </Link>{" "}
            — when a group departs, you create the room, assign a guide, and share the room code.
          </li>
        </ol>
        <p className="text-xs pt-2 border-t border-[#322F36]">
          Guides run the live timeline in their assigned room; they do not create rooms.
        </p>
      </div>
    </div>
  );
}
