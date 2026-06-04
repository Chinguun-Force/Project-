"use client";

import { useEffect, useState } from "react";
import { getToursAction } from "@/app/actions/gameActions";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TourPlansPage() {
  const router = useRouter();
  const [tours, setTours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const plans = await getToursAction();
      setTours(plans);
      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1D26]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-4">Tour Marketplace</h1>
          <p className="text-lg text-[#A0A0B0] max-w-2xl">
            Discover expeditions and see which sights you can complete for XP on each tour.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#322F36] overflow-hidden">
                <Skeleton className="aspect-video w-full rounded-none bg-[#322F36]" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-[#322F36]" />
                  <Skeleton className="h-4 w-full bg-[#322F36]" />
                </div>
              </div>
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-24 border border-[#322F36] rounded-xl">
            <MapPin className="w-12 h-12 text-[#A0A0B0] mx-auto mb-4" />
            <p className="text-lg text-white font-medium mb-2">No tours currently available</p>
            <p className="text-[#A0A0B0]">Check back later for new expeditions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => {
              const topMissions = tour.topMissions ?? tour.missions?.slice(0, 2) ?? [];
              const extraCount =
                tour.extraMissionCount ??
                Math.max(0, (tour.missions?.length ?? 0) - 2);

              return (
                <div
                  key={tour.id}
                  onClick={() => router.push(`/tours/${tour.id}`)}
                  className="group relative bg-[#252830] rounded-2xl border border-[#322F36] overflow-hidden cursor-pointer hover:border-[#F4C64D]/40 transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden bg-[#1A1D26]">
                    {tour.image_url ? (
                      <img
                        src={tour.image_url}
                        alt={tour.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-[#A0A0B0]" />
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">
                        {tour.name}
                      </h3>
                      {tour.price != null && (
                        <span className="text-lg font-bold text-white shrink-0">
                          ${Number(tour.price)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#A0A0B0] line-clamp-2 mb-4 flex-grow">
                      {tour.description ||
                        tour.journey_data?.description ||
                        (tour.location ? `Explore ${tour.location}` : "Explore Mongolia")}
                    </p>

                    {topMissions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {topMissions.map((mission: any) => (
                          <div
                            key={mission.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1D26] rounded-md border border-[#322F36] text-xs font-medium text-white"
                          >
                            {mission.image_url ? (
                              <img
                                src={mission.image_url}
                                alt=""
                                className="w-4 h-4 rounded-sm object-cover"
                              />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-[#A0A0B0]" />
                            )}
                            <span className="truncate max-w-[90px]">{mission.title}</span>
                          </div>
                        ))}
                        {extraCount > 0 && (
                          <span className="px-2.5 py-1 bg-[#1A1D26] rounded-md border border-[#322F36] text-xs font-medium text-[#A0A0B0]">
                            +{extraCount}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-[#A0A0B0] pt-4 border-t border-[#322F36]">
                      {tour.duration_days != null && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>
                            {tour.duration_days} {tour.duration_days === 1 ? "Day" : "Days"}
                          </span>
                        </div>
                      )}
                      {tour.start_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(tour.start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-[#F4C64D] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
