"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

export type NavItem = {
  label?: string;
  isSection?: boolean;
  title?: string;
  icon?: LucideIcon;
  href?: string;
  children?: NavItem[];
};

function isItemActive(item: NavItem, pathname: string): boolean {
  if (!item.href) return false;
  if (item.href === "/dashboard") return pathname === "/dashboard";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function isParentOfActive(item: NavItem, pathname: string): boolean {
  return !!item.children?.some(
    (c) => isItemActive(c, pathname) || isParentOfActive(c, pathname),
  );
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item, index) => (
        <NavMainItem
          key={item.title || item.label || index}
          item={item}
          pathname={pathname}
        />
      ))}
    </>
  );
}

function NavMainItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const hasChildren = !!item.children?.length;
  const isActive = isItemActive(item, pathname);
  const isParentActive = isParentOfActive(item, pathname);
  const [isOpen, setIsOpen] = React.useState(isParentActive);

  React.useEffect(() => {
    if (isParentActive) setIsOpen(true);
  }, [isParentActive]);

  if (item.isSection && item.label) {
    return (
      <SidebarGroup className="p-0 pt-5 first:pt-0">
        <SidebarGroupLabel className="p-0 px-4 text-[11px] font-bold uppercase tracking-wider text-[#afafaf] dark:text-neutral-500">
          {item.label}
        </SidebarGroupLabel>
      </SidebarGroup>
    );
  }

  if (hasChildren && item.title) {
    return (
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isParentActive}
                  className={cn(
                    "rounded-full text-sm font-medium px-4 py-2.5 h-10 transition-colors cursor-pointer",
                    isParentActive ? "bg-black text-white hover:bg-black hover:text-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black" : "hover:bg-[#efefef] dark:hover:bg-neutral-800",
                  )}
                >
                  {item.icon && <item.icon size={16} />}
                  <span>{item.title}</span>
                  <ChevronRight
                    className={cn(
                      "ml-auto transition-transform duration-200",
                      isOpen && "rotate-90",
                    )}
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="me-0 pe-0">
                  {item.children!.map((child, index) => (
                    <NavMainSubItem
                      key={child.title || index}
                      item={child}
                      pathname={pathname}
                    />
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  if (item.title) {
    return (
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={isActive}
              className={cn(
                "rounded-full text-sm font-medium px-4 py-2.5 h-10 transition-colors",
                isActive
                  ? "bg-black text-white hover:bg-black hover:text-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                  : "hover:bg-[#efefef] dark:hover:bg-neutral-800",
              )}
            >
              <Link href={item.href || "#"}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return null;
}

function NavMainSubItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const hasChildren = !!item.children?.length;
  const isActive = isItemActive(item, pathname);
  const isParentActive = isParentOfActive(item, pathname);
  const [isOpen, setIsOpen] = React.useState(isParentActive);

  React.useEffect(() => {
    if (isParentActive) setIsOpen(true);
  }, [isParentActive]);

  if (hasChildren && item.title) {
    return (
      <SidebarMenuSubItem>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton className="rounded-md text-sm font-medium px-3 py-2 h-9 cursor-pointer">
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight
                className={cn(
                  "ml-auto transition-transform duration-200",
                  isOpen && "rotate-90",
                )}
              />
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="me-0 pe-0">
              {item.children!.map((child, index) => (
                <NavMainSubItem
                  key={child.title || index}
                  item={child}
                  pathname={pathname}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>
    );
  }

  if (item.title) {
    return (
      <SidebarMenuSubItem className="w-full">
        <SidebarMenuSubButton
          asChild
          isActive={isActive}
          className={cn(
            "w-full rounded-md transition-colors",
            isActive ? "bg-muted text-foreground" : "",
          )}
        >
          <Link href={item.href || "#"}>{item.title}</Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return null;
}
