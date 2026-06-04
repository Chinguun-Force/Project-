"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getModeratorRoomsAction,
  getModeratorTripsAction,
  getCompanyGuidesAction,
  createRoomAction,
} from "../actions";
import { Spinner } from "@/components/ui/spinner";
import { DoorOpen, Plus } from "lucide-react";

export default function ModeratorRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripId, setTripId] = useState("");
  const [guideId, setGuideId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [r, t, g] = await Promise.all([
      getModeratorRoomsAction(),
      getModeratorTripsAction(),
      getCompanyGuidesAction(),
    ]);
    setRooms(r);
    setTrips(t);
    setGuides(g);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const genCode = () => {
    setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId || !roomCode.trim()) {
      return toast.error("Trip template and room code are required");
    }
    setSubmitting(true);
    try {
      await createRoomAction({
        tripId,
        guideId: guideId || null,
        roomCode,
      });
      toast.success("Room created — activities cloned from template");
      setTripId("");
      setGuideId("");
      setRoomCode("");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
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
        <DoorOpen className="w-6 h-6 text-[#F2994A]" />
        Rooms
      </h1>
      <p className="text-sm text-[#A0A0B0] mb-6">
        Start a micro-group: pick a template, assign a guide, share the room code with tourists.
        You create rooms; guides run the live timeline.
      </p>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-[#322F36] bg-[#322F36]/40 p-5 mb-8 space-y-3"
      >
        <h2 className="text-sm font-semibold text-white">New room (departure)</h2>
        <select
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
          className="w-full h-10 rounded-lg bg-[#1A1D26] border border-[#322F36] text-white px-3 text-sm"
          required
        >
          <option value="">Tour template…</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          value={guideId}
          onChange={(e) => setGuideId(e.target.value)}
          className="w-full h-10 rounded-lg bg-[#1A1D26] border border-[#322F36] text-white px-3 text-sm"
        >
          <option value="">Assign guide (optional)</option>
          {guides.map((g) => (
            <option key={g.id} value={g.id}>
              {g.full_name ?? g.id.slice(0, 8)}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room code (coupon)"
            className="bg-[#1A1D26] border-[#322F36] text-white font-mono uppercase"
            required
          />
          <Button type="button" variant="outline" onClick={genCode} className="shrink-0 border-[#322F36]">
            Generate
          </Button>
        </div>
        <Button
          type="submit"
          disabled={submitting || trips.length === 0}
          className="w-full bg-[#F2994A] text-[#1A1D26] font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create room
        </Button>
        {trips.length === 0 && (
          <p className="text-xs text-amber-500">Create a tour template first.</p>
        )}
      </form>

      <h2 className="text-sm font-semibold text-[#A0A0B0] mb-3 uppercase tracking-wide">
        Active & past rooms
      </h2>
      <ul className="space-y-2">
        {rooms.length === 0 ? (
          <li className="text-sm text-[#A0A0B0]">No rooms yet.</li>
        ) : (
          rooms.map((r) => {
            const tripTitle =
              (r.trips as { title?: string } | null)?.title ?? "Trip";
            const guideName = r.guide_name ?? "—";
            return (
              <li
                key={r.id}
                className="rounded-lg border border-[#322F36] bg-[#322F36]/50 px-4 py-3 text-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-mono text-[#F4C64D] font-bold">{r.room_code}</span>
                  <span className="text-xs text-[#A0A0B0] uppercase">{r.status}</span>
                </div>
                <p className="text-white mt-1">{tripTitle}</p>
                <p className="text-xs text-[#A0A0B0] mt-1">Guide: {guideName}</p>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
