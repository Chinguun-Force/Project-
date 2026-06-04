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
  User,
  Settings,
  LogOut,
  Shield,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";
import { ShagaiIcon } from "@/components/ShagaiIcon";

const navItems = [
  { path: "/", label: "Dashboard", icon: Compass },
  { path: "/quests", label: "Quests", icon: MapPin },
  { path: "/missions", label: "Missions", icon: Route },
  { path: "/tours", label: "Tours", icon: Trophy },
  { path: "/map", label: "Map", icon: Map },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { role, loading: roleLoading, isStaffRole, showModeratorPanelNav, showAdminPanelNav } =
    useUserRole();
  const { userStats, refreshStats } = useUserStats();
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 hover:bg-[#322F36]/50"
                    >
                      <Avatar className="w-8 h-8 border-2 border-[#F4C64D]/30">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-[#322F36] text-[#F4C64D] text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm text-white max-w-[120px] truncate">
                        {displayName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-[#322F36] border-[#322F36] text-white"
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-[#A0A0B0] capitalize">{role}</p>
                      <p className="text-xs text-[#F4C64D] mt-1 flex items-center gap-1">
                        <ShagaiIcon size="xs" balance={pointsBalance} />
                        {pointsBalance.toLocaleString()} Shagai
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-[#1A1D26]" />
                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                      className="cursor-pointer hover:bg-[#1A1D26] focus:bg-[#1A1D26]"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/settings")}
                      className="cursor-pointer hover:bg-[#1A1D26] focus:bg-[#1A1D26]"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    {showModeratorPanelNav && !isStaffRole && (
                      <DropdownMenuItem
                        onClick={() => router.push("/moderator")}
                        className="cursor-pointer hover:bg-[#1A1D26] focus:bg-[#1A1D26]"
                      >
                        <UserCog className="w-4 h-4 mr-2" />
                        Moderator Panel
                      </DropdownMenuItem>
                    )}
                    {showAdminPanelNav && !isStaffRole && (
                      <DropdownMenuItem
                        onClick={() => router.push("/admin")}
                        className="cursor-pointer hover:bg-[#1A1D26] focus:bg-[#1A1D26]"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-[#1A1D26]" />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer text-red-400 hover:bg-[#1A1D26] focus:bg-[#1A1D26] focus:text-red-400"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
