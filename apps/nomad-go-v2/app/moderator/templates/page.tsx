"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getModeratorTripsAction,
  createTripTemplateAction,
  updateTripMarketplaceAction,
  getTripActivitiesAction,
  addTripActivityAction,
  getCatalogMissionsAction,
  getTripMissionsAction,
  addTripMissionAction,
  removeTripMissionAction,
} from "../actions";
import { Spinner } from "@/components/ui/spinner";
import { Globe, Map, Plus, X } from "lucide-react";

export default function ModeratorTemplatesPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [tripMissions, setTripMissions] = useState<any[]>([]);
  const [catalogMissions, setCatalogMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [location, setLocation] = useState("");
  const [publishNew, setPublishNew] = useState(true);
  const [marketImage, setMarketImage] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [marketDuration, setMarketDuration] = useState("");
  const [marketLocation, setMarketLocation] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTrips = async () => {
    const data = await getModeratorTripsAction();
    setTrips(data);
  };

  const loadTripMissions = async (tripId: string) => {
    const linked = await getTripMissionsAction(tripId);
    setTripMissions(linked);
  };

  useEffect(() => {
    (async () => {
      try {
        const [tripData, missionCatalog] = await Promise.all([
          getModeratorTripsAction(),
          getCatalogMissionsAction(),
        ]);
        setTrips(tripData);
        setCatalogMissions(missionCatalog);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedTripId) {
      setActivities([]);
      setTripMissions([]);
      return;
    }
    const trip = trips.find((t) => t.id === selectedTripId);
    if (trip) {
      setMarketImage(trip.image_url ?? "");
      setMarketPrice(trip.price != null ? String(trip.price) : "");
      setMarketDuration(trip.duration_days != null ? String(trip.duration_days) : "");
      setMarketLocation(trip.location ?? "");
      setIsPublished(!!trip.is_published);
    }
    (async () => {
      try {
        const [acts, linked] = await Promise.all([
          getTripActivitiesAction(selectedTripId),
          getTripMissionsAction(selectedTripId),
        ]);
        setActivities(acts);
        setTripMissions(linked);
      } catch (e: any) {
        toast.error(e.message);
      }
    })();
  }, [selectedTripId, trips]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    setSubmitting(true);
    try {
      await createTripTemplateAction({
        title,
        description,
        imageUrl,
        price: price ? parseFloat(price) : undefined,
        durationDays: durationDays ? parseInt(durationDays, 10) : undefined,
        location,
        isPublished: publishNew,
      });
      toast.success("Tour template created");
      setTitle("");
      setDescription("");
      setImageUrl("");
      setPrice("");
      setDurationDays("");
      setLocation("");
      await loadTrips();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId || !activityName.trim()) {
      return toast.error("Select a trip and enter an activity name");
    }
    setSubmitting(true);
    try {
      const nextOrder =
        activities.length > 0
          ? Math.max(...activities.map((a) => a.default_sequence_order)) + 1
          : 0;
      await addTripActivityAction({
        tripId: selectedTripId,
        name: activityName,
        sequenceOrder: nextOrder,
      });
      toast.success("Activity added");
      setActivityName("");
      setActivities(await getTripActivitiesAction(selectedTripId));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMission = async (missionId: string, isLinked: boolean) => {
    if (!selectedTripId) return;
    setSubmitting(true);
    try {
      if (isLinked) {
        await removeTripMissionAction(selectedTripId, missionId);
        toast.success("Sight removed from template");
      } else {
        await addTripMissionAction(selectedTripId, missionId);
        toast.success("Sight added to template");
      }
      await loadTripMissions(selectedTripId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMarketplace = async () => {
    if (!selectedTripId) return;
    setSubmitting(true);
    try {
      await updateTripMarketplaceAction(selectedTripId, {
        imageUrl: marketImage,
        price: marketPrice ? parseFloat(marketPrice) : undefined,
        durationDays: marketDuration ? parseInt(marketDuration, 10) : undefined,
        location: marketLocation,
        isPublished,
      });
      toast.success("Tours page listing updated");
      await loadTrips();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const linkedIds = new Set(tripMissions.map((m) => m.id));

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
        <Map className="w-6 h-6 text-[#F4C64D]" />
        Tour templates
      </h1>
      <p className="text-sm text-[#A0A0B0] mb-6">
        Itinerary steps (timeline) + sightseeing missions (geofence XP). Rooms inherit both from the template.
      </p>

      <form
        onSubmit={handleCreateTrip}
        className="rounded-xl border border-[#322F36] bg-[#322F36]/40 p-5 mb-8 space-y-3"
      >
        <h2 className="text-sm font-semibold text-white">New template</h2>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Gobi 5-day expedition"
          className="bg-[#1A1D26] border-[#322F36] text-white"
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="bg-[#1A1D26] border-[#322F36] text-white"
        />
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Cover image URL"
          className="bg-[#1A1D26] border-[#322F36] text-white"
        />
        <div className="grid grid-cols-3 gap-2">
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price ($)"
            type="number"
            className="bg-[#1A1D26] border-[#322F36] text-white"
          />
          <Input
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="Days"
            type="number"
            className="bg-[#1A1D26] border-[#322F36] text-white"
          />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="bg-[#1A1D26] border-[#322F36] text-white"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#A0A0B0] cursor-pointer">
          <input
            type="checkbox"
            checked={publishNew}
            onChange={(e) => setPublishNew(e.target.checked)}
            className="rounded"
          />
          Show on Tours marketplace immediately
        </label>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[#F4C64D] text-[#1A1D26] font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create template
        </Button>
      </form>

      <div className="rounded-xl border border-[#322F36] bg-[#322F36]/40 p-5 mb-8">
        <label className="text-sm text-[#A0A0B0] block mb-2">Select template to edit</label>
        <select
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.target.value)}
          className="w-full h-10 rounded-lg bg-[#1A1D26] border border-[#322F36] text-white px-3 text-sm"
        >
          <option value="">Select tour template…</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {selectedTripId && (
        <>
          <section className="rounded-xl border border-[#F4C64D]/30 bg-[#322F36]/40 p-5 mb-8">
            <h2 className="text-sm font-semibold text-[#F4C64D] mb-3">
              Tours page card (marketplace)
            </h2>
            <div className="space-y-3">
              <Input
                value={marketImage}
                onChange={(e) => setMarketImage(e.target.value)}
                placeholder="Cover image URL"
                className="bg-[#1A1D26] border-[#322F36] text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(e.target.value)}
                  placeholder="Price ($)"
                  type="number"
                  className="bg-[#1A1D26] border-[#322F36] text-white"
                />
                <Input
                  value={marketDuration}
                  onChange={(e) => setMarketDuration(e.target.value)}
                  placeholder="Duration (days)"
                  type="number"
                  className="bg-[#1A1D26] border-[#322F36] text-white"
                />
                <Input
                  value={marketLocation}
                  onChange={(e) => setMarketLocation(e.target.value)}
                  placeholder="Location"
                  className="bg-[#1A1D26] border-[#322F36] text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                Published on /tours (requires at least one sight for badges)
              </label>
              <Button
                type="button"
                disabled={submitting}
                onClick={handleSaveMarketplace}
                className="bg-[#F2994A] text-[#1A1D26] font-semibold"
              >
                Save marketplace settings
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-[#322F36] bg-[#322F36]/40 p-5 mb-8">
            <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#A8C69F]" />
              Sights / missions (gamification)
            </h2>
            <p className="text-xs text-amber-500/90 mb-4">
              Select places travelers can visit for XP on this tour.
            </p>

            {tripMissions.length > 0 && (
              <ul className="flex flex-wrap gap-2 mb-4">
                {tripMissions.map((m) => (
                  <li
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded-full bg-[#A8C69F]/20 text-[#A8C69F] border border-[#A8C69F]/30 px-2 py-1 text-xs"
                  >
                    {m.title}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleToggleMission(m.id, true)}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {catalogMissions.map((m) => {
                const isLinked = linkedIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleToggleMission(m.id, isLinked)}
                    className={`text-left rounded-lg p-3 border text-sm transition-all ${
                      isLinked
                        ? "border-[#A8C69F] bg-[#A8C69F]/10 text-white"
                        : "border-[#322F36] bg-[#1A1D26]/60 text-[#A0A0B0] hover:border-[#A0A0B0]"
                    }`}
                  >
                    <span className="font-medium line-clamp-1">{m.title}</span>
                    {(m.xp_reward ?? 0) > 0 && (
                      <span className="text-xs block mt-1">+{m.xp_reward} XP</span>
                    )}
                  </button>
                );
              })}
            </div>
            {catalogMissions.length === 0 && (
              <p className="text-sm text-[#A0A0B0]">No missions in catalog. Admin can create missions.</p>
            )}
          </section>

          <section className="rounded-xl border border-[#322F36] bg-[#322F36]/40 p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Itinerary steps (guide timeline)</h2>
            <ol className="space-y-2 mb-4">
              {activities.map((a, i) => (
                <li
                  key={a.id}
                  className="flex gap-3 text-sm text-white bg-[#1A1D26]/60 rounded-lg px-3 py-2"
                >
                  <span className="text-[#F4C64D] font-mono w-6">{i + 1}.</span>
                  {a.name}
                </li>
              ))}
              {activities.length === 0 && (
                <li className="text-sm text-[#A0A0B0]">No activities yet.</li>
              )}
            </ol>
            <form onSubmit={handleAddActivity} className="flex gap-2">
              <Input
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="Activity name"
                className="bg-[#1A1D26] border-[#322F36] text-white flex-1"
              />
              <Button
                type="submit"
                disabled={submitting}
                size="sm"
                className="bg-[#A8C69F] text-[#1A1D26] shrink-0"
              >
                Add step
              </Button>
            </form>
          </section>
        </>
      )}

      {trips.length === 0 && (
        <p className="text-sm text-[#A0A0B0] text-center">Create a tour template first.</p>
      )}
    </div>
  );
}
