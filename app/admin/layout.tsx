"use client";

import React from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  Database,
  ArrowLeft,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

/* -------------------------------------------------------------------------- */
/*                              Nav data                                       */
/* -------------------------------------------------------------------------- */

type AdminNavItem = {
  title: string;
  icon: LucideIcon;
  href: string;
};

const navItems: AdminNavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { title: "Utilisateurs", icon: Users, href: "/admin/users" },
  { title: "Scraper", icon: Database, href: "/admin/scraper" },
];

const backItem: AdminNavItem = {
  title: "Retour au site",
  icon: ArrowLeft,
  href: "/dashboard",
};

/* -------------------------------------------------------------------------- */
/*                              Sidebar nav                                    */
/* -------------------------------------------------------------------------- */

function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarGroup className="p-0">
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "rounded-lg text-sm px-3 py-2 h-9",
                    isActive
                      ? "bg-primary hover:bg-primary dark:bg-blue-500 text-white dark:hover:bg-blue-500 hover:text-white"
                      : ""
                  )}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator className="my-2" />

      <SidebarGroup className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={backItem.title}
              className="rounded-lg text-sm px-3 py-2 h-9"
            >
              <Link href={backItem.href}>
                <backItem.icon />
                <span>{backItem.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Layout                                         */
/* -------------------------------------------------------------------------- */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      <SidebarProvider>
        <Sidebar className="py-4 px-0 bg-background flex flex-col h-full">
          {/* ---------------- Header / Logo ---------------- */}
          <SidebarHeader className="py-0 px-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin" className="w-full h-full">
                  <img
                    src="/logo-kandid.png"
                    alt="Kandid"
                    className="h-5"
                  />
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          {/* ---------------- Navigation ---------------- */}
          <SidebarContent className="flex-1 overflow-auto gap-0 px-4 mt-6">
            <AdminNav />
          </SidebarContent>
        </Sidebar>

        {/* ---------------- Main area ---------------- */}
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-50 flex items-center border-b px-6 py-3 bg-background">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 size-8 cursor-pointer" />
                <span className="text-sm font-semibold">Admin Kandid</span>
              </div>
              <div className="flex items-center gap-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </div>
            </div>
          </header>
          <main className="flex-1">
            <div className="p-6 max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
