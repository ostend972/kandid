'use client';

import Feature12 from '@/components/shadcn-space/blocks/feature-12/index';
import HeroPage from '@/components/shadcn-space/blocks/hero-14/index';
import Pricing from '@/components/shadcn-space/blocks/pricing-04/pricing';
import Services from '@/components/shadcn-space/blocks/services-06/services';
import TestimonialsDemo from '@/components/shadcn-space/blocks/testimonial-05/index';
import FaqSection from '@/components/shadcn-space/blocks/faq-section';

export default function LandingPage() {
  return (
    <div>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Kandid',
              url: 'https://kandid.ch',
              description:
                "Outil IA qui adapte votre CV aux normes suisses, recherche d emploi en Suisse romande et generation de dossier de candidature complet pour les frontaliers.",
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              inLanguage: 'fr',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'CHF',
                description: 'Acces gratuit pendant la beta',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Kandid',
                url: 'https://kandid.ch',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Pourquoi mon CV francais est-il rejete en Suisse ?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: "Le marche suisse attend un CV de 2 pages avec photo professionnelle, equivalences de diplomes (CFC, HES), niveaux de langue CECR et terminologie locale (contrat fixe au lieu de CDI). Un CV au format francais est souvent filtre par les logiciels ATS des recruteurs suisses.",
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Kandid est-il vraiment gratuit ?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: "Oui. Pendant la phase beta, toutes les fonctionnalites sont accessibles gratuitement : analyse CV, recherche parmi 20 000+ offres, et generation de dossier de candidature complet. Aucune carte de credit requise.",
                  },
                },
                {
                  '@type': 'Question',
                  name: "Qu est-ce qu un frontalier et ai-je besoin d un permis G ?",
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: "Un frontalier reside dans un pays limitrophe et traverse la frontiere pour travailler en Suisse. Le permis G est delivre apres signature du contrat de travail — vous n avez pas besoin de l obtenir avant de postuler.",
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Comment fonctionne le matching IA de Kandid ?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: "L algorithme compare votre profil extrait du CV (competences, langues, experience, secteur) avec les exigences de chaque offre et attribue un score de compatibilite sur 100.",
                  },
                },
              ],
            },
          ]),
        }}
      />

      {/* hero-14 */}
      <section>
        <HeroPage />
      </section>

      {/* feature-12 */}
      <section>
        <Feature12 />
      </section>

      {/* pricing-04 */}
      <section>
        <Pricing />
      </section>

      {/* services-06 */}
      <section>
        <Services />
      </section>

      {/* faq */}
      <section>
        <FaqSection />
      </section>

      {/* testimonial-05 */}
      <section>
        <TestimonialsDemo />
      </section>
    </div>
  );
}
