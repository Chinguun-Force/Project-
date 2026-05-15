import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  Target,
  MapPin,
  Route,
  TrendingUp,
  CheckCircle,
  XCircle,
  Crown,
  UserCheck,
  UserCog,
  Compass,
  Star,
} from "lucide-react";

const roleColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  moderator: "bg-[#F2994A]/20 text-[#F2994A] border-[#F2994A]/30",
  guide: "bg-[#A8C69F]/20 text-[#A8C69F] border-[#A8C69F]/30",
  tourist: "bg-[#322F36] text-[#A0A0B0] border-[#322F36]",
};

const roleIcons: Record<string, typeof Crown> = {
  admin: Crown,
  moderator: UserCog,
  guide: UserCheck,
  tourist: Compass,
};

export default function Admin() {
  const { user } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: stats } = trpc.admin.stats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: usersList } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: pendingPlans } = trpc.admin.pendingTourPlans.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate();
    },
  });

  const validateTourMutation = trpc.admin.validateTourPlan.useMutation({
    onSuccess: () => {
      utils.admin.pendingTourPlans.invalidate();
      utils.admin.stats.invalidate();
    },
  });

  const [selectedRole, setSelectedRole] = useState<Record<number, string>>({});

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1D26]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#322F36] mx-auto mb-4" />
          <p className="text-lg text-[#A0A0B0] mb-4">Admin access required</p>
          <Button
            onClick={() => router.push("/")}
            className="bg-[#F4C64D] text-[#1A1D26]"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1D26]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#F4C64D]" />
            Admin Panel
          </h1>
          <p className="text-sm text-[#A0A0B0]">
            Manage users, quests, and tour plans
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#A8C69F]" />
              <span className="text-xs text-[#A0A0B0]">Users</span>
            </div>
            <span className="text-2xl font-bold text-white font-mono-data">
              {stats?.totalUsers ?? 0}
            </span>
          </div>
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#F4C64D]" />
              <span className="text-xs text-[#A0A0B0]">Quests</span>
            </div>
            <span className="text-2xl font-bold text-white font-mono-data">
              {stats?.totalQuests ?? 0}
            </span>
          </div>
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#F2994A]" />
              <span className="text-xs text-[#A0A0B0]">Missions</span>
            </div>
            <span className="text-2xl font-bold text-white font-mono-data">
              {stats?.totalMissions ?? 0}
            </span>
          </div>
          <div className="bg-[#322F36]/80 rounded-xl p-4 border border-[#322F36]">
            <div className="flex items-center gap-2 mb-2">
              <Route className="w-4 h-4 text-[#A8C69F]" />
              <span className="text-xs text-[#A0A0B0]">Tour Plans</span>
            </div>
            <span className="text-2xl font-bold text-white font-mono-data">
              {stats?.totalTourPlans ?? 0}
            </span>
          </div>
        </div>

        {/* Users Management */}
        <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] mb-6">
          <div className="p-4 border-b border-[#1A1D26]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F4C64D]" />
              User Management
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A1D26]">
                  <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">
                    User
                  </th>
                  <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">
                    Email
                  </th>
                  <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">
                    Current Role
                  </th>
                  <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">
                    Change Role
                  </th>
                  <th className="text-left p-3 text-xs text-[#A0A0B0] font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {usersList?.map((u) => {
                  const RoleIcon = roleIcons[u.role] ?? Compass;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-[#1A1D26]/50 hover:bg-[#1A1D26]/30"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar ?? "/rank-nomad.png"}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm text-white">
                            {u.name ?? "Unnamed"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-[#A0A0B0]">
                          {u.email}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            roleColors[u.role]
                          }`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={selectedRole[u.id] ?? u.role}
                          onChange={(e) =>
                            setSelectedRole({
                              ...selectedRole,
                              [u.id]: e.target.value,
                            })
                          }
                          className="bg-[#1A1D26] text-white text-sm rounded-lg px-2 py-1 border border-[#322F36] focus:border-[#F4C64D] outline-none"
                        >
                          <option value="tourist">Tourist</option>
                          <option value="guide">Guide</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          onClick={() =>
                            updateRoleMutation.mutate({
                              userId: u.id,
                              role: (selectedRole[u.id] ??
                                u.role) as "admin" | "moderator" | "guide" | "tourist",
                            })
                          }
                          disabled={
                            (selectedRole[u.id] ?? u.role) === u.role
                          }
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
        </div>

        {/* Pending Tour Plans */}
        {pendingPlans && pendingPlans.length > 0 && (
          <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36]">
            <div className="p-4 border-b border-[#1A1D26]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#F4C64D]" />
                Pending Tour Plans ({pendingPlans.length})
              </h2>
            </div>
            <div className="divide-y divide-[#1A1D26]">
              {pendingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 flex items-center justify-between hover:bg-[#1A1D26]/30"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {plan.title}
                    </p>
                    <p className="text-xs text-[#A0A0B0] mt-0.5">
                      {plan.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-mono-data text-[#F4C64D]">
                        {plan.totalXp} XP
                      </span>
                      <span className="text-xs text-[#A0A0B0]">
                        {plan.estimatedDuration}h
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          plan.difficulty === "easy"
                            ? "bg-[#A8C69F]/20 text-[#A8C69F] border-[#A8C69F]/30"
                            : plan.difficulty === "hard"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-[#F2994A]/20 text-[#F2994A] border-[#F2994A]/30"
                        }`}
                      >
                        {plan.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        validateTourMutation.mutate({
                          tourPlanId: plan.id,
                          approved: true,
                        })
                      }
                      className="bg-[#A8C69F] hover:bg-[#A8C69F]/90 text-[#1A1D26] h-7 w-7 p-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        validateTourMutation.mutate({
                          tourPlanId: plan.id,
                          approved: false,
                        })
                      }
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
