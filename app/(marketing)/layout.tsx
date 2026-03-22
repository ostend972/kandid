import Navbar from '@/components/shadcn-space/blocks/navbar-06/navbar';
import Footer from '@/components/shadcn-space/blocks/footer-04/footer';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`flex min-h-screen flex-col ${inter.className}`}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
