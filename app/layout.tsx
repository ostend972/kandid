import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import { Agentation } from 'agentation';
import { CookieConsent } from '@/components/cookie-consent';

export const metadata: Metadata = {
  title: 'Kandid - Analyse CV & Recherche Emploi Suisse',
  description:
    'Analysez votre CV et trouvez les meilleures offres d\'emploi en Suisse romande.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={frFR}>
      <html
        lang="fr"
        className={`bg-white dark:bg-black text-black dark:text-white ${inter.className}`}
      >
      <head>
        {process.env.NODE_ENV === "development" && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" />
        )}
      </head>
        <body className="min-h-[100dvh] bg-white dark:bg-black">
          {children}
          <CookieConsent />
          {process.env.NODE_ENV === 'development' && <Agentation />}
        </body>
      </html>
    </ClerkProvider>
  );
}
