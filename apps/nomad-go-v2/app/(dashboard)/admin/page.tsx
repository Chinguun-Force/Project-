"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getUsers,
  updateUserRole,
  createMission,
  getMissions,
  createQuest,
  getGuides,
  createSession,
} from "./actions";
import {
  Shield,
  Users,
  Target,
  MapPin,
  Route,
  Crown,
  UserCheck,
  UserCog,
  Compass,
  Plus,
  Save,
} from "lucide-react";

const roleColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  moderator: "bg-[#F2994A]/20 text-[#F2994A] border-[#F2994A]/30",
  guide: "bg-[#A8C69F]/20 text-[#A8C69F] border-[#A8C69F]/30",
  tourist: "bg-[#322F36] text-[#A0A0B0] border-[#322F36]",
  user: "bg-[#322F36] text-[#A0A0B0] border-[#322F36]",
};

const roleIcons: Record<string, typeof Crown> = {
  admin: Crown,
  moderator: UserCog,
  guide: UserCheck,
  tourist: Compass,
  user: Compass,
};

export default function Admin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "missions" | "quests" | "sessions">("users");

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  // Form states
  const [missionForm, setMissionForm] = useState({ title: "", description: "", imageUrl: "", xpReward: 100, latitude: 47.92, longitude: 106.92, radiusMeters: 50 });
  const [questForm, setQuestForm] = useState({ title: "", description: "", type: "quiz", pointReward: 50, difficulty: "easy", isCasual: true, missionId: "", questData: "{}" });
  const [sessionForm, setSessionForm] = useState({ name: "", location: "", startDate: "", endDate: "", guideId: "" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uData, mData, gData] = await Promise.all([
        getUsers(),
        getMissions(),
        getGuides(),
      ]);
      setUsers(uData || []);
      setMissions(mData || []);
      setGuides(gData || []);
    } catch (err: any) {
      toast.error("Failed to load admin data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, currentRole: string) => {
    const newRole = selectedRoles[userId] || currentRole;
    if (newRole === currentRole) return;
    try {
      await updateUserRole(userId, newRole);
      toast.success("Role updated successfully!");
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateMission = async () => {
    if (!missionForm.title || !missionForm.latitude || !missionForm.longitude) return toast.error("Title and Coordinates are required");
    setIsSubmitting(true);
    try {
      await createMission(missionForm);
      toast.success("Mission created successfully!");
      setMissionForm({ title: "", description: "", imageUrl: "", xpReward: 100, latitude: 47.92, longitude: 106.92, radiusMeters: 50 });
      // reload missions
      const mData = await getMissions();
      setMissions(mData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuest = async () => {
    if (!questForm.title) return toast.error("Title is required");
    if (!questForm.isCasual && !questForm.missionId) return toast.error("Mission ID required for Location-Locked Quest");
    let parsedData = {};
    try {
      parsedData = JSON.parse(questForm.questData);
    } catch (e) {
      return toast.error("Invalid JSON in Quest Data");
    }
    
    setIsSubmitting(true);
    try {
      await createQuest({ ...questForm, questData: parsedData, missionId: questForm.missionId || null });
      toast.success("Quest created successfully!");
      setQuestForm({ title: "", description: "", type: "quiz", pointReward: 50, difficulty: "easy", isCasual: true, missionId: "", questData: "{}" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate) return toast.error("Name and Dates are required");
    setIsSubmitting(true);
    try {
      const res = await createSession(sessionForm);
      toast.success(`Session created! Invite Code: ${res.inviteCode}`);
      setSessionForm({ name: "", location: "", startDate: "", endDate: "", guideId: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1D26]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#F4C64D]" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#A0A0B0]">
            Manage users, gamified quests, physical missions, and tour sessions.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex space-x-2 overflow-x-auto mb-6 bg-[#322F36]/50 p-1 rounded-xl">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("users")}
            className={`flex-1 rounded-lg text-sm font-semibold ${
              activeTab === "users" ? "bg-[#1A1D26] text-[#F4C64D] shadow-sm" : "text-[#A0A0B0] hover:text-white"
            }`}
          >
            <Users className="w-4 h-4 mr-2" /> Users
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("missions")}
            className={`flex-1 rounded-lg text-sm font-semibold ${
              activeTab === "missions" ? "bg-[#1A1D26] text-[#F4C64D] shadow-sm" : "text-[#A0A0B0] hover:text-white"
            }`}
          >
            <MapPin className="w-4 h-4 mr-2" /> Missions
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("quests")}
            className={`flex-1 rounded-lg text-sm font-semibold ${
              activeTab === "quests" ? "bg-[#1A1D26] text-[#F4C64D] shadow-sm" : "text-[#A0A0B0] hover:text-white"
            }`}
          >
            <Target className="w-4 h-4 mr-2" /> Quests
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("sessions")}
            className={`flex-1 rounded-lg text-sm font-semibold ${
              activeTab === "sessions" ? "bg-[#1A1D26] text-[#F4C64D] shadow-sm" : "text-[#A0A0B0] hover:text-white"
            }`}
          >
            <Route className="w-4 h-4 mr-2" /> Sessions
          </Button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4C64D]"></div>
          </div>
        ) : (
          <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] overflow-hidden p-6">
            
            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1A1D26]">
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">User</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Email</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Current Role</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Change Role</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const RoleIcon = roleIcons[u.role] ?? Compass;
                      return (
                        <tr key={u.id} className="border-b border-[#1A1D26]/50 hover:bg-[#1A1D26]/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img src={u.avatar_url ?? "/rank-nomad.png"} alt="" className="w-8 h-8 rounded-full object-cover" />
                              <span className="text-sm text-white">{u.full_name ?? "Unnamed"}</span>
                            </div>
                          </td>
                          <td className="p-3"><span className="text-sm text-[#A0A0B0]">{u.email}</span></td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[u.role]}`}>
                              <RoleIcon className="w-3 h-3" /> {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={selectedRoles[u.id] ?? u.role}
                              onChange={(e) => setSelectedRoles({ ...selectedRoles, [u.id]: e.target.value })}
                              className="bg-[#1A1D26] text-white text-sm rounded-lg px-2 py-1 border border-[#322F36] focus:border-[#F4C64D] outline-none"
                            >
                              <option value="user">User</option>
                              <option value="tourist">Tourist</option>
                              <option value="guide">Guide</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              onClick={() => handleRoleUpdate(u.id, u.role)}
                              disabled={(selectedRoles[u.id] ?? u.role) === u.role}
                              className="bg-[#F4C64D] hover:bg-[#F4C64D]/90 text-[#1A1D26] h-7 text-xs"
                            >
                              Update
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* MISSIONS TAB */}
            {activeTab === "missions" && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-4">Create New Mission (Physical Checkpoint)</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Mission Title</label>
                    <Input value={missionForm.title} onChange={e => setMissionForm({...missionForm, title: e.target.value})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Description</label>
                    <textarea value={missionForm.description} onChange={e => setMissionForm({...missionForm, description: e.target.value})} className="w-full rounded-md bg-[#1A1D26] border border-[#322F36] text-white p-2 mt-1 min-h-[100px]" />
                  </div>
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Image URL</label>
                    <Input value={missionForm.imageUrl} onChange={e => setMissionForm({...missionForm, imageUrl: e.target.value})} placeholder="https://..." className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                    {missionForm.imageUrl && (
                      <img src={missionForm.imageUrl} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-[#322F36]" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm text-[#A0A0B0]">XP Reward</label>
                      <Input type="number" value={missionForm.xpReward} onChange={e => setMissionForm({...missionForm, xpReward: parseInt(e.target.value) || 0})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Latitude</label>
                      <Input type="number" step="0.000001" value={missionForm.latitude} onChange={e => setMissionForm({...missionForm, latitude: parseFloat(e.target.value) || 0})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Longitude</label>
                      <Input type="number" step="0.000001" value={missionForm.longitude} onChange={e => setMissionForm({...missionForm, longitude: parseFloat(e.target.value) || 0})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Radius (meters)</label>
                      <Input type="number" value={missionForm.radiusMeters} onChange={e => setMissionForm({...missionForm, radiusMeters: parseInt(e.target.value) || 0})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                    </div>
                  </div>
                  <Button onClick={handleCreateMission} disabled={isSubmitting} className="w-full bg-[#A8C69F] text-[#1A1D26] font-bold mt-4">
                    {isSubmitting ? <span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#1A1D26]/30 border-t-[#1A1D26] rounded-full animate-spin" /> Creating...</span> : <><Plus className="w-4 h-4 mr-2" /> Create Mission</>}
                  </Button>
                </div>
              </div>
            )}

            {/* QUESTS TAB */}
            {activeTab === "quests" && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-4">Create New Quest (Gamified Task)</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Quest Title</label>
                    <Input value={questForm.title} onChange={e => setQuestForm({...questForm, title: e.target.value})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Description</label>
                    <textarea value={questForm.description} onChange={e => setQuestForm({...questForm, description: e.target.value})} className="w-full rounded-md bg-[#1A1D26] border border-[#322F36] text-white p-2 mt-1 min-h-[80px]" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Type</label>
                      <select value={questForm.type} onChange={e => setQuestForm({...questForm, type: e.target.value})} className="w-full h-10 mt-1 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3">
                        <option value="quiz">Quiz</option>
                        <option value="photo">Photo</option>
                        <option value="action">Action</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Points</label>
                      <Input type="number" value={questForm.pointReward} onChange={e => setQuestForm({...questForm, pointReward: parseInt(e.target.value) || 0})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Difficulty</label>
                      <select value={questForm.difficulty} onChange={e => setQuestForm({...questForm, difficulty: e.target.value})} className="w-full h-10 mt-1 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4 mt-2">
                    <label className="text-sm text-white flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={questForm.isCasual} 
                        onChange={e => setQuestForm({...questForm, isCasual: e.target.checked})} 
                        className="w-4 h-4"
                      />
                      Is Casual Quest?
                    </label>
                    {!questForm.isCasual && (
                      <div className="flex-1">
                        <select 
                          value={questForm.missionId} 
                          onChange={e => setQuestForm({...questForm, missionId: e.target.value})} 
                          className="w-full h-10 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3"
                        >
                          <option value="">Select Linked Mission...</option>
                          {missions.map(m => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-[#A0A0B0]">Quest Metadata (JSON)</label>
                    <textarea value={questForm.questData} onChange={e => setQuestForm({...questForm, questData: e.target.value})} className="w-full rounded-md bg-[#1A1D26] border border-[#322F36] text-white p-2 mt-1 min-h-[100px] font-mono text-sm" placeholder='{"question": "What is..."}' />
                  </div>
                  <Button onClick={handleCreateQuest} disabled={isSubmitting} className="w-full bg-[#F2994A] text-[#1A1D26] font-bold mt-4">
                    <Save className="w-4 h-4 mr-2" /> Create Quest
                  </Button>
                </div>
              </div>
            )}

            {/* SESSIONS TAB */}
            {activeTab === "sessions" && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-4">Create Tour Session</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Session Name</label>
                    <Input value={sessionForm.name} onChange={e => setSessionForm({...sessionForm, name: e.target.value})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Location</label>
                    <Input value={sessionForm.location} onChange={e => setSessionForm({...sessionForm, location: e.target.value})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Start Date</label>
                      <Input type="date" value={sessionForm.startDate} onChange={e => setSessionForm({...sessionForm, startDate: e.target.value})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-[#A0A0B0]">End Date</label>
                      <Input type="date" value={sessionForm.endDate} onChange={e => setSessionForm({...sessionForm, endDate: e.target.value})} className="bg-[#1A1D26] border-[#322F36] text-white mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Assign Guide</label>
                    <select value={sessionForm.guideId} onChange={e => setSessionForm({...sessionForm, guideId: e.target.value})} className="w-full h-10 mt-1 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3">
                      <option value="">No Guide (Self-guided)</option>
                      {guides.map(g => (
                        <option key={g.id} value={g.id}>{g.full_name || g.email}</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleCreateSession} disabled={isSubmitting} className="w-full bg-[#F4C64D] text-[#1A1D26] font-bold mt-4">
                    <Plus className="w-4 h-4 mr-2" /> Create Session & Gen Invite Code
                  </Button>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
