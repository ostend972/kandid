import { AppSidebar } from '@/components/shadcn-space/blocks/sidebar-01/app-sidebar';
import { Inter } from 'next/font/google';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      <AppSidebar>
        <div className="p-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </AppSidebar>
    </div>
  );
}
