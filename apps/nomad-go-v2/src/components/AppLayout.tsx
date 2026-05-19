import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
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

const navItems = [
  { path: "/", label: "Dashboard", icon: Compass },
  { path: "/quests", label: "Quests", icon: MapPin },
  { path: "/missions", label: "Missions", icon: Route },
  { path: "/tours", label: "Tours", icon: Trophy },
  { path: "/map", label: "Map", icon: Map },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = user?.user_metadata?.role === "admin" || false;
  const displayName = user?.user_metadata?.playerName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Nomad";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-[#1A1D26] text-white flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#1A1D26]/90 backdrop-blur-md border-b border-[#322F36]/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto w-full">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Compass className="w-7 h-7 text-[#F4C64D]" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#F4C64D]">Nomad</span>
              <span className="text-white">-Go</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-2 transition-all ${isActive
                      ? "text-[#F4C64D] bg-[#F4C64D]/10"
                      : "text-[#A0A0B0] hover:text-white hover:bg-[#322F36]/50"
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              );
            })}
            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => router.push("/admin")}
                className={`flex items-center gap-2 transition-all ${pathname === "/admin"
                    ? "text-[#F4C64D] bg-[#F4C64D]/10"
                    : "text-[#A0A0B0] hover:text-white hover:bg-[#322F36]/50"
                  }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Admin</span>
              </Button>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
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
                    <span className="hidden sm:block text-sm text-white">
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
                    <p className="text-xs text-[#A0A0B0]">
                      {user.user_metadata?.role ? (user.user_metadata.role as string).charAt(0).toUpperCase() + (user.user_metadata.role as string).slice(1) : "User"}
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
                  {isAdmin && (
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
                    onClick={logout}
                    className="cursor-pointer text-red-400 hover:bg-[#1A1D26] focus:bg-[#1A1D26] focus:text-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden sticky bottom-0 z-50 bg-[#1A1D26]/95 backdrop-blur-md border-t border-[#322F36]/50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${isActive
                    ? "text-[#F4C64D]"
                    : "text-[#A0A0B0] hover:text-white"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => router.push("/admin")}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${pathname === "/admin"
                  ? "text-[#F4C64D]"
                  : "text-[#A0A0B0] hover:text-white"
                }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-medium">Admin</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
