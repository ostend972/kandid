import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kandid — CV suisse pour frontaliers | IA gratuite',
  description: 'Outil IA gratuit pour frontaliers : analysez votre CV suisse, trouvez 20 000+ offres en Suisse romande et generez votre dossier complet. Essayez Kandid.',
  alternates: {
    canonical: 'https://kandid.ch',
  },
  openGraph: {
    title: 'Kandid — Adaptez votre CV au marche suisse',
    description: 'Analysez votre CV, trouvez des offres en Suisse romande et generez un dossier de candidature complet avec l\'IA. Gratuit pour les frontaliers.',
    url: 'https://kandid.ch',
    siteName: 'Kandid',
    type: 'website',
    locale: 'fr_CH',
    images: [{ url: 'https://kandid.ch/og-image.png', width: 1200, height: 630, alt: 'Kandid - Outil IA pour adapter votre CV au marche suisse' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kandid — Adaptez votre CV au marche suisse',
    description: 'Outil IA gratuit pour adapter votre candidature au marche suisse.',
    images: ['https://kandid.ch/og-image.png'],
  },
};
