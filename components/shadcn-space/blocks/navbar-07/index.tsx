// @ts-nocheck
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "@/components/shadcn-space/blocks/navbar-07/navbar";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// -- Types --

export type NavigationItem = {
    title: string;
    description?: string;
    icon?: LucideIcon;
    href?: string;
};

export type FeatureSection = {
    heading: string;
    items: NavigationItem[];
};

export type HighlightCard = {
    title: string;
    description: string;
    href?: string;
};

export type NavigationLink = {
    title: string;
    href: string;
    hasDropdown?: boolean;
    featureSections?: FeatureSection[];
    highlightCard?: HighlightCard;
};

// -- Data --

const navigationLinks: NavigationLink[] = [
    {
        title: "Fonctionnalites",
        href: "/#fonctionnalites",
        hasDropdown: true,
        featureSections: [
            {
                heading: "",
                items: [
                    {
                        title: "Analyse CV",
                        description: "Score de compatibilite avec le marche suisse",
                        href: "/sign-up",
                    },
                    {
                        title: "Recherche d'emploi",
                        description: "20 000+ offres en Suisse romande",
                        href: "/sign-up",
                    },
                    {
                        title: "CV suisse IA",
                        description: "CV 2 pages adapte a chaque offre",
                        href: "/sign-up",
                    },
                ],
            },
            {
                heading: "",
                items: [
                    {
                        title: "Lettre de motivation",
                        description: "Methode VOUS-MOI-NOUS",
                        href: "/sign-up",
                    },
                    {
                        title: "Dossier complet",
                        description: "CV + lettre + references en un PDF",
                        href: "/sign-up",
                    },
                    {
                        title: "Matching IA",
                        description: "Score de compatibilite par offre",
                        href: "/sign-up",
                    },
                ],
            },
        ],
        highlightCard: {
            title: "Nouveau",
            description: "Generez un dossier de candidature complet avec l'IA",
            href: "/sign-up",
        },
    },
    { title: "Tarifs", href: "/pricing" },
];

// -- Sub-Components (Mega Menu) --

const MegaMenuPanel = ({
    link,
    isVisible,
}: {
    link: NavigationLink;
    isVisible: boolean;
}) => {
    if (!link.featureSections) return null;
    const totalCols = link.featureSections.length + (link.highlightCard ? 1 : 0);

    return (
        <div
            className={cn(
                "absolute top-full left-0 right-0 w-full bg-background border-b border-border shadow-xl shadow-primary/5 z-50 transition-all duration-300 ease-in-out overflow-hidden border-t",
                isVisible
                    ? "opacity-100 max-h-125 translate-y-0 pointer-events-auto"
                    : "opacity-0 max-h-0 -translate-y-2 pointer-events-none",
            )}
        >
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
                <div
                    className={cn(
                        "grid gap-4 relative",
                        link.highlightCard ? "grid-cols-3" : `grid-cols-${totalCols}`,
                    )}
                >
                    {link.featureSections.map((section, i) => (
                        <div key={i}>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <a
                                        key={item.title}
                                        href={item.href || "#"}
                                        className="flex flex-col rounded-lg p-2.5 hover:bg-muted/80 transition-all group"
                                    >
                                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                            {item.title}
                                            <ArrowRight
                                                size={12}
                                                className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                                            />
                                        </span>
                                        <span className="text-xs text-muted-foreground font-normal leading-relaxed">
                                            {item.description}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}

                    {link.highlightCard && (
                        <div className="py-3 px-4 rounded-xl bg-muted flex flex-col items-start justify-center gap-3">
                            <p className="text-sm font-medium text-foreground">
                                {link.highlightCard.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {link.highlightCard.description}
                            </p>
                            <a
                                href={link.highlightCard.href || "#"}
                                className="text-sm font-medium text-primary flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                Commencer
                                <ArrowRight size={14} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// -- Entry Point Component --

const NavbarBlock = () => {
    return (
        <Navbar navigationLinks={navigationLinks} MegaMenuPanel={MegaMenuPanel} />
    );
};

export default NavbarBlock;
