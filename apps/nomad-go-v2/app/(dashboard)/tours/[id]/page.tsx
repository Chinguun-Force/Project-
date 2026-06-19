"use client";
import { useEffect, useState } from "react";
import { getTourDetailsAction } from "@/app/actions/gameActions";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TourItinerary from "@/components/nomad/TourItinerary";
import { CompanyProfileCard } from "@/components/company/CompanyProfileCard";

export default function TourDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();

  const [tour, setTour] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchTour = async () => {
      setIsLoading(true);
      if (id) {
        const data = await getTourDetailsAction(id);
        setTour(data);
      }
      setIsLoading(false);
    };

    fetchTour();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="h-[40vh] min-h-[300px] w-full rounded-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-12 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Tour not found</h1>
        <p className="text-muted-foreground">
          The expedition you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  const isTripTemplate = tour.isTripTemplate !== false;
  const activeRoomId = user?.user_metadata?.room_id as string | undefined;
  const isEnrolled = Boolean(activeRoomId);
  const publicMissions = [...(tour.missions || [])].sort(
    (a: { xp_reward?: number }, b: { xp_reward?: number }) =>
      (b.xp_reward ?? 0) - (a.xp_reward ?? 0),
  );
  const journeyDays = tour.journey_days || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative h-[40vh] min-h-[300px] w-full bg-muted">
        {tour.image_url ? (
          <img
            src={tour.image_url}
            alt={tour.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-muted-foreground opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              {tour.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm md:text-base font-medium">
              {tour.price != null && (
                <div className="text-foreground text-xl font-bold">${tour.price}</div>
              )}
              {tour.duration_days && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{tour.duration_days} Days</span>
                </div>
              )}
              {tour.start_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(tour.start_date).toLocaleDateString()}</span>
                </div>
              )}
              {tour.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{tour.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-12">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Overview</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {tour.description ||
              `Join us for an unforgettable experience in ${tour.location || "Mongolia"}.`}
          </p>
          {isTripTemplate && (
            <p className="text-sm text-[#F4C64D]/90 mb-6">
              This is a tour template — sights below are missions you can complete for XP when
              you join a departure (room code from your guide).
            </p>
          )}

          {publicMissions.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-foreground mb-6">
                Key Sights & Missions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {publicMissions.map((mission: any) => (
                  <div
                    key={mission.id}
                    className="p-4 rounded-xl border border-border bg-card overflow-hidden"
                  >
                    {mission.image_url && (
                      <img
                        src={mission.image_url}
                        alt={mission.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h4 className="font-semibold text-foreground mb-1">
                      {mission.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {mission.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {tour.company && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Your tour operator</h2>
            <CompanyProfileCard company={tour.company} />
          </div>
        )}

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tour Agenda</h2>
            {!isEnrolled && (
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Template preview — join with your room code on Home
              </span>
            )}
          </div>
          <TourItinerary days={journeyDays} locked={!isEnrolled} />
        </div>

        {!isEnrolled && (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 md:p-12 text-center bg-card">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Join your live group
            </h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Your tour operator creates a room for each departure and gives you a unique
              expedition code. Enter it on your Home dashboard to unlock the live itinerary
              and GPS quests.
            </p>
            <Button type="button" onClick={() => router.push("/")}>
              Go to Home — Join expedition
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
