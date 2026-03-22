import NavbarBlock from '@/components/shadcn-space/blocks/navbar-07/index';
import { Footer } from '@/components/marketing/footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarBlock />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
