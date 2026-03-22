import Pricing from '@/components/shadcn-space/blocks/pricing-04/pricing';
import Faq from '@/components/shadcn-space/blocks/faq-04/faq';

export const metadata = {
  title: 'Tarifs — Kandid | CV suisse pour frontaliers',
  description:
    'Plans et tarifs Kandid. Analysez votre CV gratuitement et generez un dossier de candidature complet pour le marche suisse. Sans engagement.',
};

export default function PricingPage() {
  return (
    <div>
      {/* Pricing */}
      <section>
        <Pricing />
      </section>

      {/* FAQ */}
      <section>
        <Faq />
      </section>
    </div>
  );
}
