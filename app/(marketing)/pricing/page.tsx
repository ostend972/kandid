import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, Minus } from 'lucide-react';

export const metadata = {
  title: 'Tarifs — Kandid',
  description:
    'Plans et tarifs Kandid. Commencez gratuitement avec le score ATS de votre CV.',
};

const plans = [
  {
    name: 'Gratuit',
    description: 'Pour decouvrir Kandid',
    price: '0',
    popular: false,
    cta: 'Commencer gratuitement',
    ctaVariant: 'outline' as const,
    features: [
      'Analyse CV de votre CV',
      '3 offres d\'emploi par jour',
      'Chatbot : 3 messages par jour',
      'Conseils de base',
    ],
  },
  {
    name: 'Pro',
    description: 'Pour les candidats serieux',
    price: '29',
    popular: true,
    cta: 'Commencer avec Pro',
    ctaVariant: 'default' as const,
    features: [
      'CV et lettres de motivation illimites',
      'Toutes les offres d\'emploi',
      'Matching IA avance',
      'Optimisation profil LinkedIn',
      'Chatbot illimite',
      'Export PDF optimise',
      'Alertes emploi personnalisees',
    ],
  },
  {
    name: 'Premium',
    description: 'Accompagnement complet',
    price: '49',
    popular: false,
    cta: 'Commencer avec Premium',
    ctaVariant: 'outline' as const,
    features: [
      'Tout le plan Pro',
      'Calendrier editorial LinkedIn',
      'Preparation aux entretiens',
      'Simulation d\'entretien IA',
      'Support prioritaire',
      'Conseiller dedie',
    ],
  },
];

interface ComparisonFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  premium: boolean | string;
}

const comparisonFeatures: ComparisonFeature[] = [
  { name: 'Analyse CV', free: true, pro: true, premium: true },
  { name: 'Analyse detaillee du CV', free: '1 analyse', pro: 'Illimite', premium: 'Illimite' },
  { name: 'Lettres de motivation', free: false, pro: 'Illimite', premium: 'Illimite' },
  { name: 'Offres d\'emploi / jour', free: '3', pro: 'Toutes', premium: 'Toutes' },
  { name: 'Matching IA', free: false, pro: true, premium: true },
  { name: 'Chatbot messages / jour', free: '3', pro: 'Illimite', premium: 'Illimite' },
  { name: 'Optimisation LinkedIn', free: false, pro: true, premium: true },
  { name: 'Alertes emploi', free: false, pro: true, premium: true },
  { name: 'Export PDF optimise', free: false, pro: true, premium: true },
  { name: 'Calendrier editorial', free: false, pro: false, premium: true },
  { name: 'Preparation entretiens', free: false, pro: false, premium: true },
  { name: 'Simulation entretien IA', free: false, pro: false, premium: true },
  { name: 'Support prioritaire', free: false, pro: false, premium: true },
];

const faqItems = [
  {
    question: 'Qu\'est-ce qu\'un frontalier ?',
    answer:
      'Un frontalier est une personne qui reside dans un pays (par exemple la France) et travaille dans un pays voisin (par exemple la Suisse). Les frontaliers francais traversent chaque jour la frontiere pour travailler en Suisse, beneficiant souvent de salaires plus eleves tout en vivant en France.',
  },
  {
    question: 'Pourquoi mon CV francais ne fonctionne pas en Suisse ?',
    answer:
      'Les recruteurs et les systemes ATS (Applicant Tracking Systems) suisses ont des attentes differentes : photo professionnelle obligatoire, equivalences de diplomes, niveaux de langues selon le CECR, mention du permis de travail (permis G), terminologie specifique, et un format de 2-3 pages. Un CV francais standard ne repond pas a ces criteres.',
  },
  {
    question: 'Qu\'est-ce que le score ATS ?',
    answer:
      'Le score ATS (Applicant Tracking System) mesure la compatibilite de votre CV avec les systemes de tri automatique utilises par les entreprises suisses. Plus votre score est eleve, plus votre CV a de chances de passer les filtres automatiques et d\'etre lu par un recruteur humain.',
  },
  {
    question: 'La beta gratuite donne-t-elle acces a toutes les fonctionnalites ?',
    answer:
      'Oui ! Pendant la periode de beta, tous les utilisateurs ont acces a l\'integralite des fonctionnalites Premium. C\'est le moment ideal pour tester Kandid et optimiser vos candidatures sans aucun frais.',
  },
  {
    question: 'Ai-je besoin d\'un permis de travail pour travailler en Suisse ?',
    answer:
      'Oui, en tant que ressortissant de l\'UE/AELE residant en France, vous avez besoin d\'un permis G (permis frontalier) pour travailler en Suisse. Ce permis est generalement obtenu par votre employeur suisse une fois que vous avez un contrat de travail. Kandid vous aide a mentionner correctement votre statut de permis dans votre CV.',
  },
  {
    question: 'Quels types d\'offres d\'emploi sont disponibles ?',
    answer:
      'Kandid agrege plus de 20 000 offres d\'emploi en Suisse romande provenant de multiples sources. Les postes couvrent tous les secteurs : informatique, finance, sante, ingenierie, commerce, et bien plus. Vous pouvez filtrer par lieu, secteur, et niveau d\'experience.',
  },
  {
    question: 'Mes donnees sont-elles en securite ?',
    answer:
      'Absolument. Vos donnees personnelles et votre CV sont stockes de maniere securisee et ne sont jamais partages avec des tiers sans votre consentement. Nous sommes conformes au RGPD et a la loi federale suisse sur la protection des donnees (LPD).',
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-gray-700">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto h-5 w-5 text-emerald-500" />;
  }
  return <Minus className="mx-auto h-5 w-5 text-gray-300" />;
}

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-indigo-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Des tarifs simples et transparents
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choisissez le plan qui correspond a vos besoins. Commencez
            gratuitement, evoluez quand vous etes pret.
          </p>
          <Badge
            variant="secondary"
            className="mt-6 px-4 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 border-indigo-200"
          >
            Beta gratuite — Acces complet a toutes les fonctionnalites
          </Badge>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative bg-white shadow-sm ${
                  plan.popular
                    ? 'border-indigo-200 shadow-lg ring-2 ring-indigo-600'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white px-4 py-1">
                      Populaire
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-lg text-gray-500 ml-1">CHF/mois</span>
                  </div>
                  <Separator className="mb-6" />
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Link href="/sign-up" className="w-full">
                    <Button
                      variant={plan.ctaVariant}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : ''
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                  <Badge
                    variant="secondary"
                    className="text-xs text-indigo-700 bg-indigo-50"
                  >
                    Beta gratuite — Acces complet
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-12 sm:text-3xl">
            Comparaison detaillee des plans
          </h2>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Fonctionnalite
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Gratuit
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-600">
                    Pro
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3.5 text-sm text-gray-700">
                      {feature.name}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <FeatureCell value={feature.free} />
                    </td>
                    <td className="px-6 py-3.5 text-center bg-indigo-50/30">
                      <FeatureCell value={feature.pro} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <FeatureCell value={feature.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-12 sm:text-3xl">
            Questions frequentes
          </h2>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20 bg-indigo-600">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Pret a optimiser votre candidature ?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Commencez gratuitement et decouvrez votre score ATS en quelques
            minutes.
          </p>
          <div className="mt-8">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 text-base h-12 font-semibold"
              >
                Commencer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
