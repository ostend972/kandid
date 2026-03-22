"use client";
import React from "react";
import Link from "next/link";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { NavMain } from "@/components/shadcn-space/blocks/dashboard-shell-03/nav-main";
import { SiteHeader } from "@/components/shadcn-space/blocks/dashboard-shell-03/site-header";
import SimpleBar from "simplebar-react";
import 'simplebar-react/dist/simplebar.min.css'
import { Bookmark, Briefcase, FileSearch, LayoutDashboard, LucideIcon, Settings, } from "lucide-react";


export type NavItem = {
    label?: string;
    isSection?: boolean;
    title?: string;
    icon?: LucideIcon;
    href?: string;
    children?: NavItem[];
    isActive?: boolean;

};

export const navData: NavItem[] = [
    { label: "Menu", isSection: true },
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", isActive: true },
    { title: "Analyser un CV", icon: FileSearch, href: "/dashboard/cv-analysis" },
    { title: "Offres d'emploi", icon: Briefcase, href: "/dashboard/jobs" },
    { title: "Offres sauvegardees", icon: Bookmark, href: "/dashboard/saved-jobs" },
    { title: "Parametres", icon: Settings, href: "/dashboard/settings" },
];

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider>
            <Sidebar className="py-4 px-0 bg-background">
                <div className="flex flex-col gap-6 bg-background">
                    {/* ---------------- Header ---------------- */}
                    <SidebarHeader className="py-0 px-4">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Link href="/" className="w-full h-full">
                                    <img src="/logo-kandid.png" alt="Kandid" className="h-5" />
                                </Link>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    {/* ---------------- Content ---------------- */}
                    <SidebarContent className="overflow-hidden gap-0 px-0">
                        <SimpleBar autoHide={true} className="h-[calc(100vh-348px)] border-b border-border">
                            <div className="px-4">
                                <NavMain items={navData} />
                            </div>
                        </SimpleBar>
                        {/* card */}
                        <div className="pt-4 px-4">
                            <Card className="shadow-none ring-0 bg-primary/5 px-4 py-4">
                                <CardContent className="p-0 flex flex-col gap-2 items-center">
                                    <p className="text-sm font-medium text-card-foreground text-center">Beta gratuite</p>
                                    <p className="text-xs text-muted-foreground text-center">Acces complet a toutes les fonctionnalites</p>
                                </CardContent>
                            </Card>
                        </div>
                    </SidebarContent>
                </div>
            </Sidebar>

            {/* ---------------- Main ---------------- */}
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-50 flex items-center border-b px-6 py-3 bg-background">
                    <SiteHeader />
                </header>
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
};

export default AppSidebar;
