'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Bookmark,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/dashboard/cv-analysis',
    icon: FileText,
    label: 'Analyser un CV',
  },
  {
    href: '/dashboard/jobs',
    icon: Briefcase,
    label: "Offres d'emploi",
  },
  {
    href: '/dashboard/saved-jobs',
    icon: Bookmark,
    label: 'Offres sauvegardees',
  },
  {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Parametres',
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-black text-white dark:bg-white dark:text-black">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black dark:bg-black dark:text-white">
          <span className="text-sm font-bold">K</span>
        </div>
        <span className="text-lg font-bold tracking-tight">Kandid</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-black dark:bg-black dark:text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white dark:text-black/70 dark:hover:bg-black/10 dark:hover:text-black'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 dark:border-black/10 px-6 py-4">
        <p className="text-xs text-white/60 dark:text-black/60">Beta gratuite</p>
      </div>
    </div>
  );
}
