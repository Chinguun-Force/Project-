"use client";

import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserStats } from "@/hooks/useUserStats";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Compass,
  MapPin,
  Route,
  Trophy,
  Map,
  Settings,
  Shield,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { ShagaiIcon } from "@/components/ShagaiIcon";
import { NomadBootScreen } from "@/components/NomadBootScreen";
import {
  clearPostLoginBoot,
  shouldShowPostLoginBoot,
} from "@/lib/auth/postLoginBoot";

const navItems = [
  { path: "/", label: "Dashboard", icon: Compass },
  { path: "/quests", label: "Quests", icon: MapPin },
  { path: "/missions", label: "Missions", icon: Route },
  { path: "/tours", label: "Tours", icon: Trophy },
  { path: "/map", label: "Map", icon: Map },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { role, loading: roleLoading, isStaffRole, showModeratorPanelNav, showAdminPanelNav } =
    useUserRole();
  const { userStats, refreshStats, isLoading: statsLoading } = useUserStats();
  const pathname = usePathname();
  const router = useRouter();

  const displayName =
    user?.user_metadata?.playerName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Nomad";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const pointsBalance = Number(userStats?.availablePoints ?? userStats?.points ?? 0);

  useEffect(() => {
    if (user?.id) {
      refreshStats();
    }
  }, [user?.id, pathname, refreshStats]);

  const postLoginBoot = shouldShowPostLoginBoot();
  const shellBooting =
    authLoading || (postLoginBoot && user && (roleLoading || statsLoading));

  useEffect(() => {
    if (postLoginBoot && user && !roleLoading && !statsLoading && !authLoading) {
      clearPostLoginBoot();
    }
  }, [postLoginBoot, user, roleLoading, statsLoading, authLoading]);

  if (shellBooting) {
    return (
      <NomadBootScreen
        message={authLoading ? "Restoring your session" : "Loading your expedition"}
        submessage="Almost ready to explore Mongolia…"
      />
    );
  }

  const staffPanelNav = [
    ...(showModeratorPanelNav
      ? [{ path: "/moderator", label: "Moderator", icon: UserCog }]
      : []),
    ...(showAdminPanelNav ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const homePath =
    role === "moderator"
      ? "/moderator"
      : role === "admin"
        ? "/admin"
        : role === "guide"
          ? "/guide"
          : "/";

  const primaryNav =
    user && roleLoading
      ? []
      : isStaffRole
        ? staffPanelNav
        : navItems;

  const staffNav: typeof navItems = [];

  return (
    <div className="min-h-screen bg-[#1A1D26] text-white flex flex-col">
      <header className="sticky top-0 z-50 bg-[#1A1D26]/90 backdrop-blur-md border-b border-[#322F36]/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto w-full">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push(homePath)}
          >
            <Compass className="w-7 h-7 text-[#F4C64D]" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#F4C64D]">Nomad</span>
              <span className="text-white">-Go</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {primaryNav.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-2 transition-all ${
                    isActive
                      ? "text-[#F4C64D] bg-[#F4C64D]/10"
                      : "text-[#A0A0B0] hover:text-white hover:bg-[#322F36]/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              );
            })}
            {staffNav.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-2 transition-all ${
                    isActive
                      ? "text-[#F4C64D] bg-[#F4C64D]/10"
                      : "text-[#A0A0B0] hover:text-white hover:bg-[#322F36]/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#322F36]/80 border border-[#F4C64D]/20"
                  title="Shagai balance"
                >
                  <ShagaiIcon size="sm" balance={pointsBalance} />
                  <span className="text-sm font-semibold text-[#F4C64D] tabular-nums">
                    {pointsBalance.toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/settings")}
                  title="Settings"
                  aria-label="Open settings"
                  className={`flex items-center gap-2 hover:bg-[#322F36]/50 ${
                    pathname === "/settings"
                      ? "bg-[#F4C64D]/10 text-[#F4C64D]"
                      : ""
                  }`}
                >
                  {/* <Avatar className="w-8 h-8 border-2 border-[#F4C64D]/30">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-[#322F36] text-[#F4C64D] text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar> */}
                  {/* <span className="hidden sm:block text-sm max-w-[120px] truncate">
                    Settings
                  </span> */}
                  <Settings className="w-4 h-4 text-[#A0A0B0]" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="bg-[#F4C64D] hover:bg-[#F4C64D]/90 text-[#1A1D26] font-semibold"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>

      <nav className="md:hidden sticky bottom-0 z-50 bg-[#1A1D26]/95 backdrop-blur-md border-t border-[#322F36]/50">
        <div className="flex items-center justify-around py-2">
          {[...primaryNav, ...staffNav].map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                  isActive ? "text-[#F4C64D]" : "text-[#A0A0B0] hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
