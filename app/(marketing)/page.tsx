'use client';

import Feature12 from '@/components/shadcn-space/blocks/feature-12/index';
import HeroPage from '@/components/shadcn-space/blocks/hero-14/index';
import Pricing from '@/components/shadcn-space/blocks/pricing-04/pricing';
import Services from '@/components/shadcn-space/blocks/services-06/services';
import TestimonialsDemo from '@/components/shadcn-space/blocks/testimonial-05/index';

export default function LandingPage() {
  return (
    <div>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Kandid',
            description:
              "Analysez votre CV pour le marche suisse et trouvez des offres d'emploi adaptees aux frontaliers",
            url: 'https://kandid.ch',
            applicationCategory: 'BusinessApplication',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'CHF' },
          }),
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

      {/* testimonial-05 */}
      <section>
        <TestimonialsDemo />
      </section>
    </div>
  );
}
