"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getModeratorTeamAction,
  getHireCandidatesAction,
  hireGuideAction,
} from "../actions";
import { Spinner } from "@/components/ui/spinner";
import { UserPlus, Users } from "lucide-react";

const roleBadge: Record<string, string> = {
  moderator: "bg-[#F2994A]/20 text-[#F2994A] border-[#F2994A]/30",
  guide: "bg-[#A8C69F]/20 text-[#A8C69F] border-[#A8C69F]/30",
  tourist: "bg-[#322F36] text-[#A0A0B0] border-[#322F36]",
};

export default function ModeratorTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiringId, setHiringId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        getModeratorTeamAction(),
        getHireCandidatesAction(),
      ]);
      setTeam(t);
      setCandidates(c);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleHire = async (profileId: string) => {
    setHiringId(profileId);
    try {
      await hireGuideAction(profileId);
      toast.success("Guide added to your company");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setHiringId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="w-8 h-8 text-[#F4C64D]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
        <Users className="w-6 h-6 text-[#F4C64D]" />
        Team
      </h1>
      <p className="text-sm text-[#A0A0B0] mb-6">
        Company staff and field guides. Promote registered travelers to guide.
      </p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#A0A0B0] mb-3 uppercase tracking-wide">
          Your company
        </h2>
        <ul className="space-y-2">
          {team.length === 0 ? (
            <li className="text-sm text-[#A0A0B0]">No team members yet.</li>
          ) : (
            team.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-[#322F36]/60 border border-[#322F36] px-4 py-3"
              >
                <span className="text-white text-sm">{m.full_name ?? m.id.slice(0, 8)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${roleBadge[m.role] ?? roleBadge.tourist}`}
                >
                  {m.role}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#A0A0B0] mb-3 uppercase tracking-wide flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Hire guide (existing accounts)
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-[#A0A0B0]">
            No unassigned travelers available. New signups appear here after they register.
          </p>
        ) : (
          <ul className="space-y-2">
            {candidates.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-[#322F36]/40 border border-[#322F36] px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">{c.full_name ?? "Unnamed"}</p>
                  <p className="text-xs text-[#A0A0B0]">{c.email}</p>
                </div>
                <Button
                  size="sm"
                  disabled={hiringId === c.id}
                  onClick={() => handleHire(c.id)}
                  className="bg-[#A8C69F] text-[#1A1D26] shrink-0"
                >
                  {hiringId === c.id ? <Spinner className="w-4 h-4" /> : "Hire as guide"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
