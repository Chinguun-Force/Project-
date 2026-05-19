"use client";
import { useEffect, useState } from "react";
import { 
  createTourSessionAction, 
  addJourneyDayAction, 
  addJourneyStepAction, 
  getModeratorSessionsAction, 
  getModeratorItineraryAction 
} from "@/app/actions/moderatorActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, MapPin, List, Plus, Clock } from "lucide-react";

export default function ModeratorDashboard() {
  // Session Creation State
  const [sessionName, setSessionName] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  // Itinerary Builder State
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [itinerary, setItinerary] = useState<any[]>([]);
  
  // New Day State
  const [newDayNumber, setNewDayNumber] = useState<number>(1);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayLocation, setNewDayLocation] = useState("");

  // New Step State
  const [stepDayId, setStepDayId] = useState<string>("");
  const [newStepOrder, setNewStepOrder] = useState<number>(1);
  const [newStepTime, setNewStepTime] = useState("");
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");
  const [newStepXp, setNewStepXp] = useState<number>(50);

  const [loading, setLoading] = useState(false);

  // Load Sessions
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await getModeratorSessionsAction();
    setSessions(data);
  };

  // Load Itinerary when a session is selected
  useEffect(() => {
    if (selectedSessionId) {
      loadItinerary(selectedSessionId);
    } else {
      setItinerary([]);
    }
  }, [selectedSessionId]);

  const loadItinerary = async (sessionId: string) => {
    const data = await getModeratorItineraryAction(sessionId);
    setItinerary(data);
  };

  const handleGenerateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName || !sessionLocation || !startDate || !endDate || !inviteCode) {
      return toast.error("Please fill all session fields.");
    }
    setLoading(true);
    const res = await createTourSessionAction({
      name: sessionName,
      location: sessionLocation,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      invite_code: inviteCode
    });
    setLoading(false);

    if (res.success) {
      toast.success("Tour Session Created!");
      setSessionName("");
      setSessionLocation("");
      setStartDate("");
      setEndDate("");
      setInviteCode("");
      loadSessions();
    } else {
      toast.error(res.error || "Failed to create session");
    }
  };

  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !newDayTitle || !newDayNumber) {
      return toast.error("Select a session and fill all day fields.");
    }
    setLoading(true);
    const res = await addJourneyDayAction({
      session_id: selectedSessionId,
      day_number: newDayNumber,
      title: newDayTitle,
      location: newDayLocation
    });
    setLoading(false);

    if (res.success) {
      toast.success("Day Added!");
      setNewDayTitle("");
      setNewDayLocation("");
      setNewDayNumber(prev => prev + 1);
      loadItinerary(selectedSessionId);
    } else {
      toast.error(res.error || "Failed to add day");
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepDayId || !newStepTime || !newStepTitle) {
      return toast.error("Select a day and fill all step fields.");
    }
    setLoading(true);
    const res = await addJourneyStepAction({
      day_id: stepDayId,
      step_order: newStepOrder,
      time_slot: newStepTime,
      title: newStepTitle,
      description: newStepDesc,
      xp_reward: newStepXp
    });
    setLoading(false);

    if (res.success) {
      toast.success("Step Added!");
      setNewStepTitle("");
      setNewStepDesc("");
      setNewStepTime("");
      setNewStepOrder(prev => prev + 1);
      loadItinerary(selectedSessionId);
    } else {
      toast.error(res.error || "Failed to add step");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Moderator Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Manage tours, itinerary days, and sequential steps.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Creators */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Session Creator */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-zinc-500" />
                Create Tour Session
              </h2>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tour Name</label>
                  <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="e.g. Gobi Desert Expedition" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <Input value={sessionLocation} onChange={e => setSessionLocation(e.target.value)} placeholder="e.g. Mongolia" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Invite Code</label>
                  <div className="flex gap-2">
                    <Input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="e.g. GOBI24" className="uppercase font-mono" required />
                    <Button type="button" variant="outline" onClick={handleGenerateCode}>Generate</Button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                  Create Session
                </Button>
              </form>
            </div>

          </div>

          {/* Right Column: Itinerary Builder & Overview */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tour Selector */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-zinc-500" />
                Itinerary Builder
              </h2>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Active Tour</label>
                <select 
                  className="w-full p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  <option value="" className="text-zinc-500">-- Select a Tour --</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id} className="text-zinc-900 dark:text-zinc-900">
                      {s.name} ({new Date(s.start_date).toLocaleDateString()}) - {s.invite_code}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSessionId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add Day Form */}
                  <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/50">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-sm"><Calendar className="w-4 h-4"/> Add Journey Day</h3>
                    <form onSubmit={handleAddDay} className="space-y-3">
                      <div className="flex gap-2">
                        <div className="w-20">
                          <Input type="number" min="1" value={newDayNumber} onChange={e => setNewDayNumber(parseInt(e.target.value))} placeholder="Day" required />
                        </div>
                        <Input className="flex-1" value={newDayTitle} onChange={e => setNewDayTitle(e.target.value)} placeholder="Title (e.g. Arrival)" required />
                      </div>
                      <Input value={newDayLocation} onChange={e => setNewDayLocation(e.target.value)} placeholder="Location Note" />
                      <Button type="submit" size="sm" variant="outline" disabled={loading} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Day
                      </Button>
                    </form>
                  </div>

                  {/* Add Step Form */}
                  <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/50">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-sm"><Clock className="w-4 h-4"/> Add Step to Day</h3>
                    <form onSubmit={handleAddStep} className="space-y-3">
                      <select 
                        className="w-full p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm outline-none"
                        value={stepDayId}
                        onChange={(e) => setStepDayId(e.target.value)}
                        required
                      >
                        <option value="">-- Select Day --</option>
                        {itinerary.map(day => (
                          <option key={day.id} value={day.id} className="text-zinc-900">Day {day.day_number}: {day.title}</option>
                        ))}
                      </select>
                      
                      <div className="flex gap-2">
                        <div className="w-20">
                          <Input type="number" min="1" value={newStepOrder} onChange={e => setNewStepOrder(parseInt(e.target.value))} placeholder="Ord" required />
                        </div>
                        <Input className="w-28" value={newStepTime} onChange={e => setNewStepTime(e.target.value)} placeholder="09:00 AM" required />
                        <Input className="flex-1" type="number" min="0" value={newStepXp} onChange={e => setNewStepXp(parseInt(e.target.value))} placeholder="XP" />
                      </div>

                      <Input value={newStepTitle} onChange={e => setNewStepTitle(e.target.value)} placeholder="Title (e.g. Bus pickup)" required />
                      <Textarea value={newStepDesc} onChange={e => setNewStepDesc(e.target.value)} placeholder="Description..." className="h-16 resize-none text-sm" />
                      
                      <Button type="submit" size="sm" variant="outline" disabled={loading} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Step
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Overview */}
            {selectedSessionId && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Structural Timeline Overview</h2>
                
                {itinerary.length === 0 ? (
                  <div className="text-center p-8 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    No days added to this tour yet.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {itinerary.map((day) => (
                      <div key={day.id} className="relative pl-4 md:pl-0">
                        {/* Day Header */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold border border-zinc-200 dark:border-zinc-700">
                            {day.day_number}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{day.title}</h3>
                            {day.location && <p className="text-sm text-zinc-500">{day.location}</p>}
                          </div>
                        </div>

                        {/* Steps List */}
                        <div className="ml-5 border-l-2 border-zinc-100 dark:border-zinc-800 pl-8 space-y-6 py-2">
                          {(!day.steps || day.steps.length === 0) && (
                            <p className="text-sm text-zinc-400 italic">No steps scheduled for this day.</p>
                          )}
                          
                          {day.steps?.map((step: any) => (
                            <div key={step.id} className="relative">
                              {/* Timeline dot */}
                              <div className="absolute -left-[37px] top-1.5 w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900" />
                              
                              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-1">
                                <span className="font-mono text-sm font-medium text-zinc-500 w-24 shrink-0">
                                  {step.time_slot}
                                </span>
                                <div>
                                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{step.title}</h4>
                                  {step.description && <p className="text-sm text-zinc-500 mt-1">{step.description}</p>}
                                  {step.xp_reward > 0 && (
                                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                      +{step.xp_reward} XP
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
