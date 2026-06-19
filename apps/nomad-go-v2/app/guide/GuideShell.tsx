"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Compass, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const navItems = [
  { path: "/guide", label: "My rooms", icon: LayoutDashboard, exact: true },
];

export default function GuideShell({
  children,
  companyName,
  guideName,
  awaitingCompany,
}: {
  children: ReactNode;
  companyName?: string | null;
  guideName?: string | null;
  awaitingCompany?: boolean;
}) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string, exact: boolean) =>
    exact ? pathname === path : pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#1A1D26] text-white flex">
      <aside className="hidden md:flex w-56 flex-col border-r border-[#322F36] shrink-0">
        <div
          className="px-4 py-5 border-b border-[#322F36] cursor-pointer"
          onClick={() => router.push("/guide")}
        >
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#A8C69F]" />
            <span className="font-bold text-sm">
              <span className="text-[#A8C69F]">Guide</span> panel
            </span>
          </div>
          <p className="text-xs text-[#A0A0B0] mt-2 line-clamp-2">
            {awaitingCompany
              ? "Awaiting company — respond to invitations below"
              : (companyName ?? "Travel company")}
          </p>
          {guideName && (
            <p className="text-xs text-white/80 mt-1 truncate">{guideName}</p>
          )}
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
                    ? "bg-[#A8C69F]/15 text-[#A8C69F]"
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
        <header className="md:hidden sticky top-0 z-40 bg-[#1A1D26]/95 border-b border-[#322F36] px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/guide")}
            className="flex items-center gap-2 text-sm font-semibold text-[#A8C69F]"
          >
            <MapPin className="w-4 h-4" />
            My rooms
          </button>
          <Button variant="ghost" size="sm" onClick={() => logout()} className="text-[#A0A0B0]">
            <LogOut className="w-4 h-4" />
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
