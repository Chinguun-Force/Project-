"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/providers/trpc";
import { IosInstallGuide } from "@/components/IosInstallGuide";
import { canShowIosInstallGuide } from "@/lib/pwa/iosInstall";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings as SettingsIcon,
  Volume2,
  Bell,
  Moon,
  MapPin,
  Shield,
  LogOut,
  Trash2,
  Info,
  Smartphone,
  ChevronRight,
  User,
  UserCog,
} from "lucide-react";

export default function Settings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showModeratorPanelNav, showAdminPanelNav, isStaffRole } =
    useUserRole();
  const dailyLoginMutation = trpc.progress.dailyLogin.useMutation({
    onSuccess: (data) => {
      alert(
        `Daily login bonus! +${data.xpGained} XP, +${data.pointsGained} points`
      );
    },
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showIosInstallSection, setShowIosInstallSection] = useState(false);

  useEffect(() => {
    setShowIosInstallSection(canShowIosInstallGuide());
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1D26]">
        <p className="text-[#A0A0B0]">Please login to access settings</p>
      </div>
    );
  }

  const profileName =
    (user.user_metadata?.playerName ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0]) ??
    "Nomad";
  const showPanelLinks =
    !isStaffRole && (showModeratorPanelNav || showAdminPanelNav);

  return (
    <div className="min-h-screen bg-[#1A1D26]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#F4C64D]" />
            Settings
          </h1>
          <p className="text-sm text-[#A0A0B0]">
            Customize your Nomad-Go experience
          </p>
        </div>

        {/* Profile shortcut */}
        {/* <button
          type="button"
          onClick={() => router.push("/profile")}
          className="w-full text-left bg-[#322F36]/80 rounded-xl border border-[#322F36] p-4 mb-6 flex items-center gap-4 hover:border-[#F4C64D]/40 hover:bg-[#322F36] transition-colors"
        >
          <Avatar className="w-12 h-12 border-2 border-[#F4C64D]/30">
            <AvatarImage src={user.user_metadata?.avatar_url as string} />
            <AvatarFallback className="bg-[#1A1D26] text-[#F4C64D]">
              {profileName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profileName}
            </p>
            <p className="text-xs text-[#A0A0B0] flex items-center gap-1">
              <User className="w-3 h-3" />
              View your profile & stats
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#A0A0B0]" />
        </button> */}

        {/* Daily Login Bonus */}
        {/* <div className="bg-gradient-to-r from-[#F4C64D]/10 to-[#A8C69F]/10 rounded-xl border border-[#F4C64D]/20 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F4C64D]/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#F4C64D]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Daily Login Bonus
                </p>
                <p className="text-xs text-[#A0A0B0]">
                  Claim your daily XP and points reward
                </p>
              </div>
            </div>
            <Button
              onClick={() => dailyLoginMutation.mutate()}
              disabled={dailyLoginMutation.isPending}
              className="bg-[#F4C64D] hover:bg-[#F4C64D]/90 text-[#1A1D26] font-semibold"
            >
              {dailyLoginMutation.isPending ? "Claiming..." : "Claim"}
            </Button>
          </div>
        </div> */}

        {showIosInstallSection ? (
          <div className="bg-gradient-to-r from-emerald-500/10 to-[#A8C69F]/10 rounded-xl border border-emerald-500/25 p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  Install on iPhone / iPad
                </p>
                <p className="text-xs text-[#A0A0B0] mt-1">
                  Add Nomad-Go to your home screen via Safari.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIosGuide(true)}
                  className="mt-3 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                >
                  View install guide
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <IosInstallGuide
          open={showIosGuide}
          onOpenChange={setShowIosGuide}
          persistDismiss={false}
        />

        {/* Preferences */}
        <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] mb-6">
          <div className="p-4 border-b border-[#1A1D26]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Preferences
            </h2>
          </div>

          <div className="divide-y divide-[#1A1D26]">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-[#A8C69F]" />
                <div>
                  <p className="text-sm text-white">Sound Effects</p>
                  <p className="text-xs text-[#A0A0B0]">
                    Play sounds during gameplay
                  </p>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#F4C64D]" />
                <div>
                  <p className="text-sm text-white">Notifications</p>
                  <p className="text-xs text-[#A0A0B0]">
                    Quest and mission alerts
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-[#A0A0B0]" />
                <div>
                  <p className="text-sm text-white">Dark Mode</p>
                  <p className="text-xs text-[#A0A0B0]">
                    Always use dark theme
                  </p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#F2994A]" />
                <div>
                  <p className="text-sm text-white">Location Sharing</p>
                  <p className="text-xs text-[#A0A0B0]">
                    Share GPS for mission detection
                  </p>
                </div>
              </div>
              <Switch
                checked={locationSharing}
                onCheckedChange={setLocationSharing}
              />
            </div>
          </div>
        </div>

        {/* Account */}
        {/* <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] mb-6">
          <div className="p-4 border-b border-[#1A1D26]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Account
            </h2>
          </div>

          <div className="divide-y divide-[#1A1D26]">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Info className="w-4 h-4 text-[#A0A0B0]" />
                <p className="text-sm text-white">Account Info</p>
              </div>
              <div className="ml-7 space-y-1">
                <p className="text-xs text-[#A0A0B0]">
                  Name: {(user.user_metadata?.playerName || user.user_metadata?.full_name || user.email?.split('@')[0]) ?? "Not set"}
                </p>
                <p className="text-xs text-[#A0A0B0]">
                  Email: {user.email ?? "Not set"}
                </p>
                <p className="text-xs text-[#A0A0B0]">
                  Role: {user.user_metadata?.role as string ?? "user"}
                </p>
                <p className="text-xs text-[#A0A0B0]">
                  Joined:{" "}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div> */}

        {/* Panels (staff access for non-staff accounts) */}
        {showPanelLinks ? (
          <div className="bg-[#322F36]/80 rounded-xl border border-[#322F36] mb-6">
            <div className="p-4 border-b border-[#1A1D26]">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Panels
              </h2>
            </div>
            <div className="divide-y divide-[#1A1D26]">
              {showModeratorPanelNav ? (
                <button
                  type="button"
                  onClick={() => router.push("/moderator")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#1A1D26]/50 transition-colors"
                >
                  <span className="flex items-center gap-3 text-sm text-white">
                    <UserCog className="w-4 h-4 text-[#A8C69F]" />
                    Moderator Panel
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#A0A0B0]" />
                </button>
              ) : null}
              {showAdminPanelNav ? (
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#1A1D26]/50 transition-colors"
                >
                  <span className="flex items-center gap-3 text-sm text-white">
                    <Shield className="w-4 h-4 text-[#F4C64D]" />
                    Admin Panel
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#A0A0B0]" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Danger Zone */}
        <div className="bg-red-500/5 rounded-xl border border-red-500/20">
          <div className="p-4 border-b border-red-500/10">
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h2>
          </div>
          <div className="p-4">
            <Button
              onClick={logout}
              variant="outline"
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
