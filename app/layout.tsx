import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';

export const metadata: Metadata = {
  title: 'Kandid - Analyse CV & Recherche Emploi Suisse',
  description:
    'Analysez votre CV et trouvez les meilleures offres d\'emploi en Suisse romande.',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={frFR}>
      <html
        lang="fr"
        className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      >
        <body className="min-h-[100dvh] bg-gray-50">{children}</body>
      </html>
    </ClerkProvider>
  );
}
