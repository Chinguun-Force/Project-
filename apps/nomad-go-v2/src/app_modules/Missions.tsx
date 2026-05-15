import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Route,
  MapPin,
  Search,
  Signal,
  Navigation,
  Clock,
  Star,
} from "lucide-react";

export default function Missions() {
  const router = useRouter();
  const { data: missions, isLoading } = trpc.mission.list.useQuery();
  const [search, setSearch] = useState("");
  const [nearbyMode, setNearbyMode] = useState(false);

  const { data: nearbyMissions } = trpc.mission.nearLocation.useQuery(
    { latitude: 47.9185, longitude: 106.9177, radiusKm: 100 },
    { enabled: nearbyMode }
  );

  const displayMissions = nearbyMode ? nearbyMissions : missions;

  const filtered = displayMissions?.filter(
    (m) =>
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const missionImages: Record<string, string> = {
    "Ulaanbaatar City Center": "/quest-ulanbaatar.jpg",
    "Terelj National Park": "/quest-terelj.jpg",
    "Gobi Desert Expedition": "/quest-steppe.jpg",
    "Khuvsgul Lake": "/quest-steppe.jpg",
    "Kharkhorin Ancient City": "/quest-naadam.jpg",
    "Altai Mountains": "/quest-terelj.jpg",
  };

  return (
    <div className="min-h-screen bg-[#1A1D26]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Route className="w-6 h-6 text-[#F4C64D]" />
            Missions
          </h1>
          <p className="text-sm text-[#A0A0B0]">
            Explore GPS-fenced locations across Mongolia
          </p>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0B0]" />
            <Input
              placeholder="Search missions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#322F36] border-[#322F36] text-white placeholder:text-[#A0A0B0] focus:border-[#F4C64D]/50"
            />
          </div>
          <Button
            variant={nearbyMode ? "default" : "outline"}
            onClick={() => setNearbyMode(!nearbyMode)}
            className={
              nearbyMode
                ? "bg-[#F4C64D] text-[#1A1D26] hover:bg-[#F4C64D]/90"
                : "border-[#322F36] text-[#A0A0B0] hover:bg-[#322F36] hover:text-white"
            }
          >
            <Navigation className="w-4 h-4 mr-2" />
            {nearbyMode ? "Nearby Only" : "Show All"}
          </Button>
        </div>

        {/* Map Placeholder - Visual representation */}
        <div className="relative bg-[#322F36]/50 rounded-xl border border-[#322F36] h-64 mb-6 overflow-hidden">
          <img
            src="/quest-gps.jpg"
            alt="Map"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D26] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 text-[#A8C69F]">
              <Signal className="w-4 h-4 animate-signal" />
              <span className="text-sm font-medium">
                {nearbyMode
                  ? `${nearbyMissions?.length ?? 0} missions nearby`
                  : `${missions?.length ?? 0} missions active`}
              </span>
            </div>
          </div>
          {/* Pulsing location markers */}
          {filtered?.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-[#F4C64D] animate-signal"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Mission Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#322F36] rounded-xl h-48 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered?.map((mission) => (
              <div
                key={mission.id}
                className="bg-[#322F36] rounded-xl border border-[#322F36] hover:border-[#F4C64D]/30 transition-all overflow-hidden group cursor-pointer"
                onClick={() => router.push(`/missions/${mission.id}`)}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={mission.imageUrl ?? missionImages[mission.name] ?? "/quest-steppe.jpg"}
                    alt={mission.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#322F36] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#A8C69F]/20 text-[#A8C69F] border border-[#A8C69F]/30">
                      {mission.region ?? "Mongolia"}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A1D26]/80 backdrop-blur-sm flex items-center justify-center animate-signal">
                      <Signal className="w-4 h-4 text-[#A8C69F]" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <h3 className="text-lg font-bold text-white">
                      {mission.name}
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-[#A0A0B0] mb-3 line-clamp-2">
                    {mission.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#A8C69F]" />
                        <span className="text-xs text-[#A0A0B0] font-mono-data">
                          {mission.latitude.toFixed(2)},{" "}
                          {mission.longitude.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#F4C64D]" />
                        <span className="text-xs text-[#A0A0B0]">
                          {mission.radius}m range
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-[#F4C64D]" />
                      <span className="text-xs text-[#F4C64D] font-semibold">
                        Quests
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered?.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-[#322F36] mx-auto mb-4" />
            <p className="text-lg text-[#A0A0B0] mb-2">No missions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
