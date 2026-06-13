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
  getTenants,
  getAdminDepartures,
  createTenant,
  assignModeratorToTenant,
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
  Building2,
} from "lucide-react";
import QuestTypeConfigForm, {
  createInitialQuestConfig,
} from "@/components/admin/QuestTypeConfigForm";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { buildQuestDataPayload } from "@/lib/quest/buildQuestDataPayload";
import {
  DEFAULT_QUEST_CONFIG,
  validateQuestConfig,
  type AdminQuestExecutionType,
  type QuestConfigDraft,
} from "@/lib/quest/questAdminTypes";

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
  const [activeTab, setActiveTab] = useState<
    "companies" | "users" | "missions" | "quests" | "departures"
  >("companies");

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [departures, setDepartures] = useState<
    {
      id: string;
      room_code: string;
      status: string;
      trip_title: string;
      company_name: string;
      guide_name: string;
      created_at: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [selectedTenants, setSelectedTenants] = useState<Record<string, string>>({});
  const [newCompanyName, setNewCompanyName] = useState("");
  const [assignModerator, setAssignModerator] = useState({ profileId: "", tenantId: "" });

  // Form states
  const [missionForm, setMissionForm] = useState({ title: "", description: "", imageUrl: "", xpReward: 100, latitude: 47.92, longitude: 106.92, radiusMeters: 50 });
  const [questForm, setQuestForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    executionType: "QUIZ" as AdminQuestExecutionType,
    pointReward: 50,
    difficulty: "easy",
    isCasual: true,
    missionId: "",
    config: createInitialQuestConfig(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uData, tData, mData, dData] = await Promise.all([
        getUsers(),
        getTenants(),
        getMissions(),
        getAdminDepartures(),
      ]);
      setUsers(uData || []);
      setTenants(tData || []);
      setMissions(mData || []);
      setDepartures(dData || []);
    } catch (err: any) {
      toast.error("Failed to load admin data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, currentRole: string) => {
    const newRole = selectedRoles[userId] || currentRole;
    if (newRole === currentRole) return;

    const needsTenant = newRole === "moderator" || newRole === "guide";
    const tenantId = selectedTenants[userId] || users.find((u) => u.id === userId)?.tenant_id;
    if (needsTenant && !tenantId) {
      toast.error("Select a travel company for moderator or guide roles.");
      return;
    }

    try {
      await updateUserRole(userId, newRole, tenantId ?? null);
      toast.success("Role updated successfully!");
      const tenantName = tenants.find((t) => t.id === tenantId)?.name ?? null;
      setUsers(
        users.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: newRole === "user" ? "tourist" : newRole,
                tenant_id: needsTenant ? tenantId : null,
                tenant_name: needsTenant ? tenantName : null,
              }
            : u,
        ),
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return toast.error("Company name is required");
    setIsSubmitting(true);
    try {
      const created = await createTenant(newCompanyName);
      toast.success(`Company "${created.name}" created`);
      setNewCompanyName("");
      const tData = await getTenants();
      setTenants(tData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignModerator = async () => {
    if (!assignModerator.profileId || !assignModerator.tenantId) {
      return toast.error("Select a user and company");
    }
    setIsSubmitting(true);
    try {
      await assignModeratorToTenant(
        assignModerator.profileId,
        assignModerator.tenantId,
      );
      toast.success("Moderator assigned to company");
      setAssignModerator({ profileId: "", tenantId: "" });
      const uData = await getUsers();
      setUsers(uData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
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

  const handleExecutionTypeChange = (executionType: AdminQuestExecutionType) => {
    setQuestForm((prev) => ({
      ...prev,
      executionType,
      config: structuredClone(DEFAULT_QUEST_CONFIG),
    }));
  };

  const handleCreateQuest = async () => {
    if (!questForm.title.trim()) return toast.error("Title is required");
    if (!questForm.isCasual && !questForm.missionId) {
      return toast.error("Select a mission for location-locked quests");
    }

    const validationError = validateQuestConfig(questForm.executionType, questForm.config);
    if (validationError) return toast.error(validationError);

    setIsSubmitting(true);
    try {
      const built = await buildQuestDataPayload(questForm.executionType, questForm.config);
      await createQuest({
        title: questForm.title,
        description: questForm.description,
        imageUrl: questForm.imageUrl || null,
        dbType: built.dbType,
        pointReward: questForm.pointReward,
        difficulty: questForm.difficulty,
        isCasual: questForm.isCasual,
        missionId: questForm.missionId || null,
        questData: built.questData,
        validationCode: built.validationCode,
      });
      toast.success("Quest created successfully!");
      setQuestForm({
        title: "",
        description: "",
        imageUrl: "",
        executionType: "QUIZ",
        pointReward: 50,
        difficulty: "easy",
        isCasual: true,
        missionId: "",
        config: createInitialQuestConfig(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create quest";
      console.error("Admin createQuest failed:", err);
      toast.error(message);
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
            Manage users, missions, quests, and companies. Live departures are created in Moderator → Rooms.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex space-x-2 overflow-x-auto mb-6 bg-[#322F36]/50 p-1 rounded-xl">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("companies")}
            className={`flex-1 rounded-lg text-sm font-semibold whitespace-nowrap ${
              activeTab === "companies"
                ? "bg-[#1A1D26] text-[#F4C64D] shadow-sm"
                : "text-[#A0A0B0] hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4 mr-2" /> Companies
          </Button>
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
            onClick={() => setActiveTab("departures")}
            className={`flex-1 rounded-lg text-sm font-semibold ${
              activeTab === "departures" ? "bg-[#1A1D26] text-[#F4C64D] shadow-sm" : "text-[#A0A0B0] hover:text-white"
            }`}
          >
            <Route className="w-4 h-4 mr-2" /> Departures
          </Button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4C64D]"></div>
          </div>
        ) : (
          <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] overflow-hidden p-6">

            {/* COMPANIES TAB */}
            {activeTab === "companies" && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Travel companies (tenants)</h2>
                  <p className="text-sm text-[#A0A0B0] mb-4">
                    Create a company, then assign a moderator to own and run it (trips, rooms, guides).
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Company name"
                      className="bg-[#1A1D26] border-[#322F36] text-white"
                    />
                    <Button
                      onClick={handleCreateCompany}
                      disabled={isSubmitting}
                      className="bg-[#F4C64D] text-[#1A1D26] font-bold shrink-0"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Create
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#A0A0B0] mb-2">Existing companies</h3>
                  <ul className="space-y-2">
                    {tenants.length === 0 ? (
                      <li className="text-sm text-[#A0A0B0]">No companies yet.</li>
                    ) : (
                      tenants.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between rounded-lg bg-[#1A1D26] px-3 py-2 text-white text-sm"
                        >
                          <span>{t.name}</span>
                          <span className="text-xs text-[#A0A0B0] font-mono">{t.id.slice(0, 8)}…</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="border-t border-[#1A1D26] pt-6">
                  <h3 className="text-lg font-bold text-white mb-2">Assign company moderator</h3>
                  <div className="space-y-3">
                    <select
                      value={assignModerator.profileId}
                      onChange={(e) =>
                        setAssignModerator({ ...assignModerator, profileId: e.target.value })
                      }
                      className="w-full h-10 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3"
                    >
                      <option value="">Select user…</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name ?? u.email ?? u.id} ({u.role})
                        </option>
                      ))}
                    </select>
                    <select
                      value={assignModerator.tenantId}
                      onChange={(e) =>
                        setAssignModerator({ ...assignModerator, tenantId: e.target.value })
                      }
                      className="w-full h-10 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3"
                    >
                      <option value="">Select company…</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleAssignModerator}
                      disabled={isSubmitting}
                      className="w-full bg-[#F2994A] text-[#1A1D26] font-bold"
                    >
                      Assign as moderator
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1A1D26]">
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">User</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Email</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Company</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Current Role</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Change Role</th>
                      <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const RoleIcon = roleIcons[u.role] ?? Compass;
                      const effectiveRole =
                        selectedRoles[u.id] ?? (u.role === "user" ? "tourist" : u.role);
                      const showTenantPicker =
                        effectiveRole === "moderator" || effectiveRole === "guide";
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
                            <span className="text-sm text-[#A0A0B0]">{u.tenant_name ?? "—"}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[u.role] ?? roleColors.user}`}>
                              <RoleIcon className="w-3 h-3" /> {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <select
                                value={selectedRoles[u.id] ?? (u.role === "user" ? "tourist" : u.role)}
                                onChange={(e) =>
                                  setSelectedRoles({ ...selectedRoles, [u.id]: e.target.value })
                                }
                                className="bg-[#1A1D26] text-white text-sm rounded-lg px-2 py-1 border border-[#322F36] focus:border-[#F4C64D] outline-none"
                              >
                                <option value="tourist">Tourist</option>
                                <option value="guide">Guide</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                              </select>
                              {showTenantPicker && (
                                <select
                                  value={selectedTenants[u.id] ?? u.tenant_id ?? ""}
                                  onChange={(e) =>
                                    setSelectedTenants({
                                      ...selectedTenants,
                                      [u.id]: e.target.value,
                                    })
                                  }
                                  className="bg-[#1A1D26] text-white text-xs rounded-lg px-2 py-1 border border-[#322F36] outline-none"
                                >
                                  <option value="">Company…</option>
                                  {tenants.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
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
                  <ImageUploadField
                    label="Mission Image"
                    folder="missions"
                    value={missionForm.imageUrl}
                    onChange={(url) => setMissionForm({ ...missionForm, imageUrl: url })}
                  />
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
                <h2 className="text-xl font-bold text-white mb-1">Create New Quest</h2>
                <p className="text-sm text-[#6b7280] mb-4">
                  Config maps directly to offline execution engine (`quest_data` JSON).
                </p>
                <div className="space-y-4 rounded-2xl border border-[#322F36] bg-[#252830]/40 p-5">
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Quest Title</label>
                    <Input
                      value={questForm.title}
                      onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
                      className="bg-[#1A1D26] border-[#322F36] text-white mt-1 focus-visible:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#A0A0B0]">Description</label>
                    <textarea
                      value={questForm.description}
                      onChange={(e) =>
                        setQuestForm({ ...questForm, description: e.target.value })
                      }
                      className="w-full rounded-md bg-[#1A1D26] border border-[#322F36] text-white p-2 mt-1 min-h-[80px] focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <ImageUploadField
                    label="Quest Image"
                    folder="quests"
                    value={questForm.imageUrl}
                    onChange={(url) => setQuestForm({ ...questForm, imageUrl: url })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Execution Type</label>
                      <select
                        value={questForm.executionType}
                        onChange={(e) =>
                          handleExecutionTypeChange(e.target.value as AdminQuestExecutionType)
                        }
                        className="w-full h-10 mt-1 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3 focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="PHOTO">PHOTO</option>
                        <option value="AUDIO">AUDIO</option>
                        <option value="QR_SCAN">QR_SCAN</option>
                        <option value="QUIZ">QUIZ</option>
                        <option value="CHOICE">CHOICE</option>
                        <option value="TIME_BOUND">TIME_BOUND</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Points</label>
                      <Input
                        type="number"
                        min={0}
                        value={questForm.pointReward}
                        onChange={(e) =>
                          setQuestForm({
                            ...questForm,
                            pointReward: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="bg-[#1A1D26] border-[#322F36] text-white mt-1 focus-visible:ring-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#A0A0B0]">Difficulty</label>
                      <select
                        value={questForm.difficulty}
                        onChange={(e) =>
                          setQuestForm({ ...questForm, difficulty: e.target.value })
                        }
                        className="w-full h-10 mt-1 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3 focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="text-sm text-white flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={questForm.isCasual}
                        onChange={(e) =>
                          setQuestForm({ ...questForm, isCasual: e.target.checked })
                        }
                        className="w-4 h-4 accent-emerald-500"
                      />
                      Casual quest (global)
                    </label>
                    {!questForm.isCasual && (
                      <div className="flex-1">
                        <select
                          value={questForm.missionId}
                          onChange={(e) =>
                            setQuestForm({ ...questForm, missionId: e.target.value })
                          }
                          className="w-full h-10 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3 focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="">Select linked mission…</option>
                          {missions.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <QuestTypeConfigForm
                    executionType={questForm.executionType}
                    config={questForm.config}
                    onChange={(config: QuestConfigDraft) =>
                      setQuestForm({ ...questForm, config })
                    }
                  />

                  <Button
                    onClick={handleCreateQuest}
                    disabled={isSubmitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0f1419] font-bold mt-2"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#0f1419]/30 border-t-[#0f1419] rounded-full animate-spin" />
                        Creating…
                      </span>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Create Quest
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* DEPARTURES TAB (rooms — read-only for admin) */}
            {activeTab === "departures" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Live departures (rooms)</h2>
                    <p className="text-sm text-[#A0A0B0] mt-1">
                      Moderators create rooms from trip templates and share{" "}
                      <span className="font-mono text-[#F4C64D]">room_code</span> with tourists.
                      Legacy <span className="line-through">sessions</span> / invite codes are retired.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#F4C64D]/40 text-[#F4C64D]"
                    onClick={() => router.push("/moderator/rooms")}
                  >
                    Open Moderator Rooms →
                  </Button>
                </div>
                {departures.length === 0 ? (
                  <p className="text-[#A0A0B0] text-sm py-8 text-center">
                    No rooms yet. Assign a company moderator and create rooms from a trip template.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[#322F36]">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#1A1D26] text-[#A0A0B0] uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Trip</th>
                          <th className="px-4 py-3">Company</th>
                          <th className="px-4 py-3">Guide</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departures.map((d) => (
                          <tr key={d.id} className="border-t border-[#322F36] text-white">
                            <td className="px-4 py-3 font-mono text-[#F4C64D]">{d.room_code}</td>
                            <td className="px-4 py-3">{d.trip_title}</td>
                            <td className="px-4 py-3">{d.company_name}</td>
                            <td className="px-4 py-3">{d.guide_name}</td>
                            <td className="px-4 py-3 capitalize">{d.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
