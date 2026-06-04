"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  DoorOpen,
  LogOut,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const navItems = [
  { path: "/moderator", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/moderator/team", label: "Team", icon: Users, exact: false },
  { path: "/moderator/templates", label: "Tour templates", icon: Map, exact: false },
  { path: "/moderator/rooms", label: "Rooms", icon: DoorOpen, exact: false },
];

export default function ModeratorShell({
  children,
  companyName,
}: {
  children: ReactNode;
  companyName?: string | null;
}) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string, exact: boolean) =>
    exact ? pathname === path : pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#1A1D26] text-white flex">
      <aside className="hidden md:flex w-56 flex-col border-r border-[#322F36] bg-[#1A1D26] shrink-0">
        <div
          className="px-4 py-5 border-b border-[#322F36] cursor-pointer"
          onClick={() => router.push("/moderator")}
        >
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#F4C64D]" />
            <span className="font-bold text-sm">
              <span className="text-[#F4C64D]">Nomad</span>-Go
            </span>
          </div>
          <p className="text-xs text-[#A0A0B0] mt-2 line-clamp-2">
            {companyName ?? "Company panel"}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#F4C64D]/15 text-[#F4C64D]"
                    : "text-[#A0A0B0] hover:text-white hover:bg-[#322F36]/60"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[#322F36]">
          <Button
            variant="ghost"
            className="w-full justify-start text-[#A0A0B0] hover:text-white"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 bg-[#1A1D26]/95 border-b border-[#322F36] px-3 py-2">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    active ? "bg-[#F4C64D]/20 text-[#F4C64D]" : "text-[#A0A0B0]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
