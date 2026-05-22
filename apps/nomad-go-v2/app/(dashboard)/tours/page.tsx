"use client";
import { useEffect, useState } from "react";
import { getToursAction } from "@/app/actions/gameActions";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Loader2, ArrowRight } from "lucide-react";

export default function TourPlansPage() {
  const router = useRouter();

  const [tours, setTours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      setIsLoading(true);
      const plans = await getToursAction();
      setTours(plans);
      setIsLoading(false);
    };

    fetchTours();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-foreground mb-4">
            Tour Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover curated expeditions and immersive experiences. Browse available tours below.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-24 border border-border rounded-xl">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-foreground font-medium mb-2">
              No tours currently available
            </p>
            <p className="text-muted-foreground">Check back later for new expeditions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <div
                key={tour.id}
                onClick={() => router.push(`/tours/${tour.id}`)}
                className="group relative bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {tour.image_url ? (
                    <img
                      src={tour.image_url}
                      alt={tour.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-foreground line-clamp-1">
                      {tour.name}
                    </h3>
                    {tour.price && (
                      <span className="text-lg font-bold text-foreground">
                        ${tour.price}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground line-clamp-2 mb-4 flex-grow">
                    {tour.journey_data?.description || `Explore ${tour.location}`}
                  </p>

                  {tour.missions && tour.missions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {tour.missions.slice(0, 3).map((mission: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md border border-border text-xs font-medium text-foreground">
                          {mission.image_url ? (
                            <img src={mission.image_url} alt={mission.title} className="w-3.5 h-3.5 rounded-sm object-cover" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className="truncate max-w-[100px]">{mission.title}</span>
                        </div>
                      ))}
                      {tour.missions.length > 3 && (
                        <span className="text-xs text-muted-foreground font-medium ml-1">
                          +{tour.missions.length - 3} more sights
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                    {tour.duration_days && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{tour.duration_days} Days</span>
                      </div>
                    )}
                    {tour.start_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(tour.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="ml-auto">
                       <ArrowRight className="w-4 h-4 text-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
