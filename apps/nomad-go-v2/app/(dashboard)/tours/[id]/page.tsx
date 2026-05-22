"use client";
import { useEffect, useState } from "react";
import { getTourDetailsAction, enrollTourAction } from "@/app/actions/gameActions";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Loader2, Mail, Phone, MessageCircle, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TourDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();
  
  const [tour, setTour] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    setEnrollError("");
    setEnrollLoading(true);
    const res = await enrollTourAction(inviteCode, id);
    if (res?.error) {
      setEnrollError(res.error);
    } else {
      router.refresh();
    }
    setEnrollLoading(false);
  };

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
      <div className="min-h-screen bg-background flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Tour not found</h1>
        <p className="text-muted-foreground">The expedition you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const isEnrolled = user?.user_metadata?.session_id === tour.id;

  // The master missions are now fetched directly from the junction table and flattened onto tour.missions
  const publicMissions = tour.missions || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
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
              {tour.price && (
                <div className="text-foreground text-xl font-bold">
                  ${tour.price}
                </div>
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
        {/* Description & Public Sights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Overview</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {tour.journey_data?.description || `Join us for an unforgettable experience in ${tour.location}.`}
          </p>

          {publicMissions.length > 0 && (
             <div className="mb-12">
               <h3 className="text-xl font-bold text-foreground mb-6">Key Sights & Missions</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                 {publicMissions.map((mission: any, idx: number) => (
                   <div key={idx} className="p-4 rounded-xl border border-border bg-card">
                     <h4 className="font-semibold text-foreground mb-1">{mission.title || mission.name}</h4>
                     <p className="text-sm text-muted-foreground line-clamp-2">{mission.description}</p>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>

        {/* Locked / Enrolled Timeline */}
        {isEnrolled ? (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-8">Detailed Itinerary</h2>
            <div className="space-y-8">
              {tour.journey_days?.sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0)).map((day: any, idx: number) => (
                <div key={day.id || idx} className="relative pl-8 border-l-2 border-border pb-4 last:border-l-0">
                  <div className="absolute w-4 h-4 rounded-full bg-foreground left-[-9px] top-1" />
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-foreground">
                      Day {day.day_number || idx + 1}: {day.title || 'Exploring'}
                    </h3>
                  </div>
                  {day.description && (
                    <p className="text-muted-foreground mb-4">{day.description}</p>
                  )}
                  
                  {day.journey_steps && day.journey_steps.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {day.journey_steps.map((step: any, stepIdx: number) => (
                        <div key={step.id || stepIdx} className="p-4 rounded-xl bg-muted/50 border border-border">
                          <div className="font-medium text-foreground">{step.missions?.title || step.missions?.name || `Mission ${stepIdx + 1}`}</div>
                          {step.missions?.description && (
                            <div className="text-sm text-muted-foreground mt-1">{step.missions.description}</div>
                          )}
                          {step.xp_reward > 0 && (
                            <div className="text-xs font-bold text-foreground mt-2">+{step.xp_reward} XP</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 md:p-12 text-center bg-card">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-foreground mb-4">Lock Status: Enrolled Users Only</h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Register and input your invite code to unlock the precise timeline and live GPS quests for this expedition.
            </p>

            <form onSubmit={handleEnroll} className="max-w-md mx-auto mb-12">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter Invite Code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={enrollLoading}
                  />
                </div>
                <Button type="submit" disabled={enrollLoading || !inviteCode.trim()}>
                  {enrollLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Unlock
                </Button>
              </div>
              {enrollError && (
                <p className="text-destructive text-sm mt-2 text-left">{enrollError}</p>
              )}
            </form>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {tour.contact_email && (
                <a href={`mailto:${tour.contact_email}`} className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <Mail className="w-6 h-6 text-foreground mb-3" />
                  <span className="text-sm font-medium text-foreground">Email Us</span>
                  <span className="text-xs text-muted-foreground mt-1 truncate w-full text-center">{tour.contact_email}</span>
                </a>
              )}
              {tour.contact_phone && (
                <a href={`tel:${tour.contact_phone}`} className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <Phone className="w-6 h-6 text-foreground mb-3" />
                  <span className="text-sm font-medium text-foreground">Call Us</span>
                  <span className="text-xs text-muted-foreground mt-1">{tour.contact_phone}</span>
                </a>
              )}
              {tour.viber_link && (
                <a href={tour.viber_link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <MessageCircle className="w-6 h-6 text-foreground mb-3" />
                  <span className="text-sm font-medium text-foreground">Viber Chat</span>
                  <span className="text-xs text-muted-foreground mt-1">Message now</span>
                </a>
              )}
              {(!tour.contact_email && !tour.contact_phone && !tour.viber_link) && (
                 <div className="col-span-3 text-muted-foreground text-sm">
                   Contact information is currently unavailable for this tour.
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
