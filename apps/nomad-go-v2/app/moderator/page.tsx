"use client";
import { useEffect, useState } from "react";
import { 
  createTourSessionAction, 
  addJourneyStepAction, 
  getModeratorSessionsAction, 
  getModeratorItineraryAction,
  getAllGlobalMissionsAction
} from "@/app/actions/moderatorActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Globe, Plus, Clock, FileText, Image as ImageIcon, Link2, DollarSign } from "lucide-react";

export default function ModeratorDashboard() {
  // --- STATE: LEFT PANEL (CREATE) ---
  const [sessionName, setSessionName] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationDays, setDurationDays] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [viberLink, setViberLink] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  const [globalMissions, setGlobalMissions] = useState<any[]>([]);
  const [selectedMissions, setSelectedMissions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // --- STATE: RIGHT PANEL (AGENDA) ---
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [activeDayId, setActiveDayId] = useState<string>("");
  
  // Step Form State
  const [newStepTime, setNewStepTime] = useState("");
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");
  const [newStepXp, setNewStepXp] = useState<number>(0);
  const [isAddingStep, setIsAddingStep] = useState(false);

  // Initialization
  useEffect(() => {
    loadSessions();
    loadGlobalMissions();
  }, []);

  const loadSessions = async () => {
    const data = await getModeratorSessionsAction();
    setSessions(data);
  };

  const loadGlobalMissions = async () => {
    const data = await getAllGlobalMissionsAction();
    setGlobalMissions(data);
  };

  // Load Itinerary when session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadItinerary(selectedSessionId);
    } else {
      setItinerary([]);
      setActiveDayId("");
    }
  }, [selectedSessionId]);

  const loadItinerary = async (sessionId: string) => {
    const data = await getModeratorItineraryAction(sessionId);
    setItinerary(data);
    if (data.length > 0) {
      setActiveDayId(data[0].id); // Always select Day 1 of the new tour by default
    } else {
      setActiveDayId("");
    }
  };

  const handleGenerateCode = () => {
    setInviteCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  const toggleMission = (id: string) => {
    setSelectedMissions(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  // --- ACTIONS ---
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName || !sessionLocation || !startDate || !endDate || !inviteCode) {
      return toast.error("Please fill all required session fields.");
    }
    setIsCreating(true);
    const res = await createTourSessionAction({
      name: sessionName,
      location: sessionLocation,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      duration_days: durationDays,
      price: price,
      image_url: imageUrl,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      viber_link: viberLink,
      invite_code: inviteCode,
      mission_ids: selectedMissions
    });
    setIsCreating(false);

    if (res.success) {
      toast.success("Tour Session Created Successfully!");
      // Reset Form
      setSessionName(""); setSessionLocation(""); setStartDate(""); setEndDate("");
      setDurationDays(1); setPrice(0); setImageUrl(""); setContactEmail("");
      setContactPhone(""); setViberLink(""); setInviteCode(""); setSelectedMissions([]);
      // Reload Tours
      loadSessions();
    } else {
      toast.error(res.error || "Failed to create session");
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDayId || !newStepTime || !newStepTitle) {
      return toast.error("Please fill the time and title fields.");
    }
    setIsAddingStep(true);
    const res = await addJourneyStepAction({
      day_id: activeDayId,
      time_slot: newStepTime,
      title: newStepTitle,
      description: newStepDesc,
      xp_reward: newStepXp
    });
    setIsAddingStep(false);

    if (res.success) {
      toast.success("Step Appended to Day!");
      setNewStepTime(""); setNewStepTitle(""); setNewStepDesc(""); setNewStepXp(0);
      loadItinerary(selectedSessionId);
    } else {
      toast.error(res.error || "Failed to add step");
    }
  };

  const activeDay = itinerary.find(d => d.id === activeDayId);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Operator Workspace</h1>
          <p className="text-muted-foreground mt-2">
            Configure new expeditions and manage daily agendas seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* =========================================================
              LEFT PANEL: CREATE TOUR SESSION
             ========================================================= */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                Create Tour Session
              </h2>
            </div>
            
            <form onSubmit={handleCreateSession} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
              
              {/* Basic Metadata */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tour Name *</label>
                    <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="e.g. Gobi Desert Expedition" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Location *</label>
                    <Input value={sessionLocation} onChange={e => setSessionLocation(e.target.value)} placeholder="e.g. South Gobi, Mongolia" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Start Date *</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">End Date *</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Duration (Days) *</label>
                    <Input type="number" min="1" value={durationDays} onChange={e => setDurationDays(parseInt(e.target.value) || 1)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Price ($) *</label>
                    <Input type="number" min="0" value={price} onChange={e => setPrice(parseInt(e.target.value) || 0)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Cover Image URL</label>
                    <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="info@..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Contact Phone</label>
                    <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+976..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Viber Link</label>
                    <Input value={viberLink} onChange={e => setViberLink(e.target.value)} placeholder="viber://..." />
                  </div>
                </div>
              </div>

              {/* Invite Code */}
              <div className="pt-4 border-t border-border">
                <label className="text-sm font-medium mb-1.5 block">Secure Invite Code *</label>
                <div className="flex gap-2">
                  <Input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Generate or Type (e.g. GOBI24)" className="uppercase font-mono tracking-widest" required />
                  <Button type="button" variant="outline" onClick={handleGenerateCode}>Generate</Button>
                </div>
              </div>

              {/* Master Missions Grid */}
              <div className="pt-4 border-t border-border">
                <div className="flex flex-col gap-1 mb-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Attach Global Sights / Master Missions
                  </label>
                  <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                    ⚠️ Remember to select the sights included in this tour before creating!
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 scrollbar-thin">
                  {globalMissions.map((m) => {
                    const isSelected = selectedMissions.includes(m.id);
                    return (
                      <div 
                        key={m.id}
                        onClick={() => toggleMission(m.id)}
                        className={`cursor-pointer rounded-lg p-3 flex flex-col gap-1 border transition-all ${
                          isSelected 
                            ? 'border-foreground bg-foreground text-background shadow-md' 
                            : 'border-border bg-background text-foreground hover:border-muted-foreground'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm line-clamp-1">{m.title}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-background bg-background' : 'border-muted-foreground'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-foreground" />}
                          </div>
                        </div>
                        {m.xpReward > 0 && (
                          <span className={`text-xs ${isSelected ? 'text-background/80' : 'text-muted-foreground'}`}>
                            +{m.xpReward} XP
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {globalMissions.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 col-span-2 text-center">No master missions available.</p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isCreating} className="w-full text-base py-5">
                {isCreating ? "Deploying Session..." : "Publish New Tour Session"}
              </Button>
            </form>
          </div>


          {/* =========================================================
              RIGHT PANEL: BUILD DAILY ITINERARY
             ========================================================= */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                Build Daily Itinerary
              </h2>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[600px] flex flex-col">
              
              {/* Tour Context Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1.5">Select Active Tour to Edit</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  <option value="">-- Choose a Tour Context --</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({new Date(s.start_date).toLocaleDateString()}) - {s.invite_code}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedSessionId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <FileText className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium text-lg text-foreground">No Tour Selected</p>
                  <p className="text-sm">Select a tour from the dropdown above to load its itinerary.</p>
                </div>
              ) : (
                <div className="flex flex-col flex-1 h-full">
                  {/* Dynamic Day Swapper */}
                  {itinerary.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      No days found for this tour. Ensure duration_days &gt; 0 when creating.
                    </div>
                  ) : (
                    <>
                      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2 border-b border-border">
                        {itinerary.map((day) => (
                          <button
                            key={day.id}
                            onClick={() => setActiveDayId(day.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                              activeDayId === day.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            Day {day.day_number}
                          </button>
                        ))}
                      </div>

                      {/* Inline Form & Timeline */}
                      {activeDay && (
                        <div className="flex flex-col gap-8 flex-1">
                          
                          {/* Inline Step Form */}
                          <div className="bg-muted/30 p-4 rounded-xl border border-border">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                              <Plus className="w-4 h-4" /> Append Step to {activeDay.title}
                            </h3>
                            <form onSubmit={handleAddStep} className="space-y-3">
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Input type="time" className="sm:w-32 bg-background" value={newStepTime} onChange={e => setNewStepTime(e.target.value)} required />
                                <Input className="flex-1 bg-background" value={newStepTitle} onChange={e => setNewStepTitle(e.target.value)} placeholder="Step Title (e.g. Bus Departure)" required />
                                <Input className="sm:w-24 bg-background" type="number" min="0" value={newStepXp} onChange={e => setNewStepXp(parseInt(e.target.value) || 0)} placeholder="XP" />
                              </div>
                              <Textarea className="resize-none h-16 text-sm bg-background" value={newStepDesc} onChange={e => setNewStepDesc(e.target.value)} placeholder="Optional description..." />
                              <div className="flex justify-end">
                                <Button type="submit" disabled={isAddingStep} size="sm">
                                  {isAddingStep ? "Saving..." : "+ Add Step to Day"}
                                </Button>
                              </div>
                            </form>
                          </div>

                          {/* Timeline List */}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold mb-4">Agenda: {activeDay.title}</h3>
                            <div className="space-y-6 border-l-2 border-border ml-3 pl-6 py-2 relative">
                              {!activeDay.steps || activeDay.steps.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No steps scheduled for this day yet.</p>
                              ) : (
                                [...activeDay.steps].sort((a: any, b: any) => (a.time_slot || '').localeCompare(b.time_slot || '')).map((step: any) => (
                                  <div key={step.id} className="relative group">
                                    {/* Timeline Bullet */}
                                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-border group-hover:bg-primary transition-colors border-2 border-card" />
                                    
                                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                                      <span className="font-mono text-sm font-medium text-muted-foreground w-24 shrink-0">
                                        {step.time_slot}
                                      </span>
                                      <div>
                                        <h4 className="font-medium text-foreground">{step.title}</h4>
                                        {step.description && <p className="text-sm text-muted-foreground mt-1">{step.description}</p>}
                                        {step.xp_reward > 0 && (
                                          <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                                            +{step.xp_reward} XP
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
