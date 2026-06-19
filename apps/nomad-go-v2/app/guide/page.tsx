"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getGuideAssignedRoomsAction,
  getGuideContextAction,
  getGuideHireInvitesAction,
  acceptGuideHireAction,
  declineGuideHireAction,
} from "./actions";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight, Building2, Mail } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "text-[#A8C69F]",
  archived: "text-[#A0A0B0]",
};

type HireInvite = {
  id: string;
  tenant_id: string;
  company_name: string;
  company_logo: string | null;
  company_location: string | null;
  created_at: string;
};

export default function GuideDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [guideName, setGuideName] = useState<string | null>(null);
  const [awaitingCompany, setAwaitingCompany] = useState(false);
  const [invites, setInvites] = useState<HireInvite[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const ctx = await getGuideContextAction();
      setGuideName(ctx.fullName);
      setAwaitingCompany(!ctx.tenantId);

      if (!ctx.tenantId) {
        const pending = await getGuideHireInvitesAction();
        setInvites(pending);
        setRooms([]);
      } else {
        const data = await getGuideAssignedRoomsAction();
        setRooms(data);
        setInvites([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load guide panel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (requestId: string) => {
    setRespondingId(requestId);
    try {
      await acceptGuideHireAction(requestId);
      toast.success("You joined the travel company");
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept invitation");
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setRespondingId(requestId);
    try {
      await declineGuideHireAction(requestId);
      toast.success("Invitation declined");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not decline invitation");
    } finally {
      setRespondingId(null);
    }
  };

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

  if (awaitingCompany) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Mail className="w-7 h-7 text-[#A8C69F]" />
            Company invitations
          </h1>
          <p className="text-[#A0A0B0] mt-1 text-sm">
            {guideName ? `Hello, ${guideName}` : "Field guide"} — accept an invite to link with a
            travel company and receive room assignments.
          </p>
        </div>

        {invites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#322F36] p-10 text-center">
            <Building2 className="w-10 h-10 text-[#A0A0B0] mx-auto mb-3" />
            <p className="text-white font-medium">No pending invitations</p>
            <p className="text-sm text-[#A0A0B0] mt-2">
              A company moderator must send you a hire invite. Your admin account already has the
              guide role — wait for a company to reach out.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="rounded-xl border border-[#322F36] bg-[#322F36]/50 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  {invite.company_logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={invite.company_logo}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#1A1D26] flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-[#A8C69F]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{invite.company_name}</p>
                    {invite.company_location && (
                      <p className="text-xs text-[#A0A0B0] mt-0.5">{invite.company_location}</p>
                    )}
                    <p className="text-xs text-[#A0A0B0] mt-2">
                      Invited {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    disabled={respondingId === invite.id}
                    onClick={() => handleAccept(invite.id)}
                    className="bg-[#A8C69F] text-[#1A1D26] flex-1"
                  >
                    {respondingId === invite.id ? <Spinner className="w-4 h-4" /> : "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={respondingId === invite.id}
                    onClick={() => handleDecline(invite.id)}
                    className="border-[#322F36] text-[#A0A0B0] flex-1"
                  >
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-7 h-7 text-[#A8C69F]" />
          My assigned rooms
        </h1>
        <p className="text-[#A0A0B0] mt-1 text-sm">
          {guideName ? `Hello, ${guideName}` : "Field guide"} — run the live tour timeline for each
          group.
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
                    <p
                      className={`text-xs mt-1 capitalize ${statusColors[room.status] ?? "text-[#A0A0B0]"}`}
                    >
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
