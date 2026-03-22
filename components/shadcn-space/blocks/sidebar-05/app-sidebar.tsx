"use client"

import * as React from "react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, } from "@/components/ui/sidebar"
import { TeamSwitcher } from "@/components/shadcn-space/blocks/sidebar-05/team-switcher"
import { NavMain } from "@/components/shadcn-space/blocks/sidebar-05/nav-main"
import { NavProjects } from "@/components/shadcn-space/blocks/sidebar-05/nav-project"
import { NavUser } from "@/components/shadcn-space/blocks/sidebar-05/nav-user"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Atom, BadgeCheck, Clapperboard, Crown, FileText, KeySquare, Layers, LockOpen, ShieldUser, SquareRoundCorner } from "lucide-react"

// This is sample data.
const data = {
    user: {
        name: "ShadcnSpace",
        email: "s@example.com",
        avatar: "https://images.shadcnspace.com/assets/profiles/user-11.jpg",
    },
    teams: [
        {
            name: "ShadcnSpace Prime",
            logo: Crown,
            plan: "Elite",
        },
        {
            name: "ShadcnSpace Pulse",
            logo: BadgeCheck,
            plan: "Growth",
        },
        {
            name: "ShadcnSpace Base",
            logo: Layers,
            plan: "Community",
        },
    ],
    navMain: [
        {
            title: "Dashboards",
            url: "#",
            icon: Atom,
            isActive: true,
            items: [
                {
                    title: "Analytics",
                    url: "#",
                },
                {
                    title: "Ecommerce",
                    url: "#",
                },
                {
                    title: "Modern",
                    url: "#",
                },
            ],
        },
        {
            title: "Frontend Pages",
            url: "#",
            icon: FileText,
            items: [
                {
                    title: "Homepage",
                    url: "#",
                },
                {
                    title: "About us",
                    url: "#",
                },
                {
                    title: "Blog",
                    url: "#",
                },
                {
                    title: "Blog Details",
                    url: "#",
                },
                {
                    title: "Contact us",
                    url: "#",
                },
                {
                    title: "Portfolio",
                    url: "#",
                },
                {
                    title: "Pricing",
                    url: "#",
                },
            ],
        },
        {
            title: "Applications",
            url: "#",
            icon: Clapperboard,
            items: [
                {
                    title: "Chat",
                    url: "#"
                },
                {
                    title: "Contacts",
                    url: "#"
                },
                {
                    title: "Ecommerce",
                    url: "#"
                },
                {
                    title: "Blogs",
                    url: "#"
                },
                {
                    title: "Invoice",
                    url: "#"
                },
                {
                    title: "Notes",
                    url: "#"
                },
                {
                    title: "Calendar",
                    url: "#"
                },
                {
                    title: "Email",
                    url: "#"
                },
                {
                    title: "Ticket",
                    url: "#"
                },
                {
                    title: "Kanban",
                    url: "#"
                },
            ],
        },
        {
            title: "Pages",
            url: "#",
            icon: SquareRoundCorner,
            items: [
                {
                    title: "Account Setting",
                    url: "#"
                },
                {
                    title: "FAQ",
                    url: "#"
                },
                {
                    title: "Pricing",
                    url: "#"
                },
                {
                    title: "Roll Base Access",
                    url: "#"
                },
                {
                    title: "Integrations",
                    url: "#"
                },
                {
                    title: "API Keys",
                    url: "#"
                }
            ],
        },
    ],
    projects: [
        {
            name: "Login",
            url: "#",
            icon: KeySquare,
        },
        {
            name: "Register",
            url: "#",
            icon: ShieldUser,
        },
        {
            name: "Forgot Password",
            url: "#",
            icon: LockOpen,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent className="overflow-hidden">
                <ScrollArea className="h-[calc(100vh-85px)]">
                    <NavMain items={data.navMain} />
                    <NavProjects projects={data.projects} />
                </ScrollArea>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
