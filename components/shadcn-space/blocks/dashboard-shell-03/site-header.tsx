"use client";

import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 size-8 cursor-pointer" />
      </div>
      <div className="flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </div>
  )
}
