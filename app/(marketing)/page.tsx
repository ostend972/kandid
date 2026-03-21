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
  ArrowRight,
  Upload,
  BarChart3,
  Briefcase,
  Check,
  X,
  Users,
  FileSearch,
  Globe,
} from 'lucide-react';

export const metadata = {
  title: 'Kandid — Votre CV adapte au marche suisse',
  description:
    'Analysez votre CV pour le marche suisse, trouvez des offres d\'emploi en Suisse romande et boostez vos candidatures de frontalier. Score ATS gratuit.',
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Kandid",
    description:
      "Analysez votre CV pour le marche suisse et trouvez des offres d'emploi adaptees aux frontaliers",
    url: "https://kandid.ch",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CHF",
    },
  };

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 to-white py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 border-indigo-200"
            >
              Gratuit pendant la beta
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Votre CV francais{' '}
              <span className="text-indigo-600">ne fonctionne pas</span>{' '}
              en Suisse
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
              Decouvrez pourquoi vos candidatures n&apos;aboutissent jamais et obtenez
              un score ATS adapte au marche suisse. Gratuit.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 text-base h-12"
                >
                  Analysez votre CV gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm text-gray-500">
              Rejoint par plus de 1 200 frontaliers
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="fonctionnalites" className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Comment ca marche
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Trois etapes simples pour adapter votre candidature au marche suisse.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                icon: Upload,
                title: 'Importez votre CV',
                description:
                  'Deposez votre CV au format PDF. En 30 secondes, il est pret a etre analyse.',
              },
              {
                step: '2',
                icon: BarChart3,
                title: 'Obtenez votre score',
                description:
                  'Notre IA analyse votre CV selon les criteres ATS specifiques au marche suisse.',
              },
              {
                step: '3',
                icon: Briefcase,
                title: 'Trouvez votre emploi',
                description:
                  'Parcourez plus de 20 000 offres d\'emploi en Suisse, adaptees a votre profil.',
              },
            ].map((item) => (
              <Card
                key={item.step}
                className="relative border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
                      {item.step}
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEY PROBLEMS ===== */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Pourquoi vos candidatures echouent en Suisse ?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Le marche suisse a des attentes tres differentes du marche francais.
              Votre CV doit s&apos;y adapter.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                problem: 'Pas de photo professionnelle',
                before: 'CV sans photo, ou photo non professionnelle',
                after: 'Photo professionnelle au format suisse',
              },
              {
                problem: 'Diplomes non reconnus',
                before: 'Licence, Master — terminologie francaise',
                after: 'Equivalences suisses mentionnees (CFC, HES, etc.)',
              },
              {
                problem: 'Mauvaise terminologie',
                before: 'CDI, CDD, SMIC — jargon francais',
                after: 'Contrat fixe, temporaire — vocabulaire suisse',
              },
              {
                problem: 'Langues sans niveau CECR',
                before: '"Anglais : courant"',
                after: '"Anglais : C1 (CECR)" — niveau certifie',
              },
              {
                problem: 'Pas de permis mentionne',
                before: 'Aucune reference au permis de travail',
                after: 'Permis G frontalier clairement indique',
              },
              {
                problem: 'Format de CV inadapte',
                before: 'CV creatif ou 1 page a la francaise',
                after: 'CV structure de 2-3 pages, norme suisse',
              },
            ].map((item) => (
              <Card
                key={item.problem}
                className="border-gray-200 bg-white shadow-sm"
              >
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {item.problem}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-gray-500">{item.before}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <p className="text-sm text-gray-700">{item.after}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Les chiffres parlent d&apos;eux-memes
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Users,
                stat: '200 000+',
                label: 'frontaliers francais travaillent en Suisse',
              },
              {
                icon: FileSearch,
                stat: '20 000+',
                label: 'offres d\'emploi analysees',
              },
              {
                icon: Globe,
                stat: '0',
                label: 'outil en francais n\'existait pour les aider',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center rounded-2xl border border-gray-100 bg-gray-50/50 p-8"
              >
                <item.icon className="mx-auto h-8 w-8 text-indigo-600 mb-4" />
                <p className="text-4xl font-extrabold text-gray-900">
                  {item.stat}
                </p>
                <p className="mt-2 text-sm text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING PREVIEW ===== */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Des tarifs simples et transparents
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Commencez gratuitement. Passez a Pro quand vous etes pret.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Free */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Gratuit</CardTitle>
                <CardDescription>Pour decouvrir Kandid</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    0
                  </span>
                  <span className="text-lg text-gray-500 ml-1">CHF/mois</span>
                </div>
                <Separator className="mb-6" />
                <ul className="space-y-3">
                  {[
                    'Score ATS de votre CV',
                    '3 offres d\'emploi par jour',
                    'Chatbot : 3 messages par jour',
                  ].map((f) => (
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
                    variant="outline"
                    className="w-full"
                  >
                    Commencer gratuitement
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

            {/* Pro */}
            <Card className="relative border-indigo-200 bg-white shadow-lg ring-2 ring-indigo-600">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600 text-white px-4 py-1">
                  Populaire
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Pro</CardTitle>
                <CardDescription>Pour les candidats serieux</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    29
                  </span>
                  <span className="text-lg text-gray-500 ml-1">CHF/mois</span>
                </div>
                <Separator className="mb-6" />
                <ul className="space-y-3">
                  {[
                    'CV et lettres de motivation illimites',
                    'Toutes les offres d\'emploi',
                    'Matching IA avance',
                    'Optimisation profil LinkedIn',
                    'Chatbot illimite',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Link href="/sign-up" className="w-full">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Commencer avec Pro
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

            {/* Premium */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Premium</CardTitle>
                <CardDescription>
                  Accompagnement complet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    49
                  </span>
                  <span className="text-lg text-gray-500 ml-1">CHF/mois</span>
                </div>
                <Separator className="mb-6" />
                <ul className="space-y-3">
                  {[
                    'Tout le plan Pro',
                    'Calendrier editorial LinkedIn',
                    'Preparation aux entretiens',
                    'Support prioritaire',
                  ].map((f) => (
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
                    variant="outline"
                    className="w-full"
                  >
                    Commencer avec Premium
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
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 sm:py-24 bg-indigo-600">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Pret a decrocher votre emploi en Suisse ?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Rejoignez les frontaliers qui ont deja optimise leur candidature avec
            Kandid.
          </p>
          <div className="mt-10">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 text-base h-12 font-semibold"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
