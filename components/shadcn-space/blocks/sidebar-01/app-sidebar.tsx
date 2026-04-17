"use client";

import React from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { NavItem, NavMain } from "@/components/shadcn-space/blocks/sidebar-01/nav-main";
import { SiteHeader } from "@/components/shadcn-space/blocks/dashboard-shell-03/site-header";
import {
  BarChart3,
  Bookmark,
  Briefcase,
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  Linkedin,
  Search,
  Settings,
} from "lucide-react";

export const navData: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

  { label: "Trouver", isSection: true },
  { title: "Offres d'emploi", icon: Briefcase, href: "/dashboard/jobs" },
  { title: "Recherches sauvegardees", icon: Search, href: "/dashboard/saved-searches" },
  { title: "Offres sauvegardees", icon: Bookmark, href: "/dashboard/saved-jobs" },

  { label: "Postuler", isSection: true },
  { title: "Analyser un CV", icon: FileSearch, href: "/dashboard/cv-analysis" },
  { title: "Mes candidatures", icon: ClipboardList, href: "/dashboard/applications" },

  { label: "Optimiser", isSection: true },
  { title: "LinkedIn", icon: Linkedin, href: "/dashboard/linkedin" },
  { title: "Statistiques", icon: BarChart3, href: "/dashboard/analytics" },

  { label: "Compte", isSection: true },
  { title: "Parametres", icon: Settings, href: "/dashboard/settings" },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar className="px-0 h-full [&_[data-slot=sidebar-inner]]:h-full">
        <div className="flex flex-col gap-6 h-full">
          {/* ---------------- Header ---------------- */}
          <SidebarHeader className="px-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/" className="w-full h-full">
                  <img src="/logo-kandid.png" alt="Kandid" className="h-5" />
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          {/* ---------------- Content ---------------- */}
          <SidebarContent className="overflow-hidden">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="px-4">
                <NavMain items={navData} />
              </div>
            </ScrollArea>
          </SidebarContent>

          {/* ---------------- Footer ---------------- */}
          <div className="mt-auto px-4 pb-4">
            <div className="flex items-center justify-between rounded-full bg-black dark:bg-white px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-white dark:text-black">
                Beta
              </span>
              <span className="text-xs font-medium text-white/70 dark:text-black/70">
                Acces complet
              </span>
            </div>
          </div>
        </div>
      </Sidebar>

      {/* ---------------- Main ---------------- */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-50 flex items-center border-b px-6 py-3 bg-background">
          <SiteHeader />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}

export default AppSidebar;
