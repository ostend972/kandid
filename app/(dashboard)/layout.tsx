import AppSidebar from '@/components/shadcn-space/blocks/dashboard-shell-03/app-sidebar';
import { Inter } from 'next/font/google';

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
