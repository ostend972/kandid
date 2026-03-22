'use client';

import Link from 'next/link';
import { Instrument_Serif } from 'next/font/google';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  FileText,
  Check,
  Asterisk,
} from 'lucide-react';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
});

export default function LandingPage() {
  return (
    <>
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

      {/* ===== HERO (hero-01 style, simplified Apple-minimal) ===== */}
      <section>
        <div className="w-full h-full relative">
          <div className="relative w-full pt-16 md:pt-28 pb-16 md:pb-24 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-indigo-100/60 before:via-white before:to-violet-100/40 before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-indigo-900/20 dark:before:via-black dark:before:to-violet-900/10 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
            <div className="container mx-auto relative z-10 px-4">
              <div className="flex flex-col max-w-4xl mx-auto gap-8">
                <div className="relative flex flex-col text-center items-center gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  >
                    <Badge
                      variant="outline"
                      className="px-4 py-1.5 text-sm font-normal"
                    >
                      Gratuit pendant la beta
                    </Badge>
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    className="lg:text-7xl md:text-6xl text-4xl font-medium leading-tight md:leading-tight lg:leading-tight"
                  >
                    Votre CV francais{' '}
                    <span
                      className={`${instrumentSerif.className} tracking-tight`}
                    >
                      ne fonctionne pas
                    </span>{' '}
                    en Suisse
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 1,
                      delay: 0.1,
                      ease: 'easeInOut',
                    }}
                    className="text-base md:text-lg font-normal max-w-2xl text-muted-foreground"
                  >
                    Decouvrez pourquoi vos candidatures echouent et obtenez un
                    dossier adapte au marche suisse. Analyse IA gratuite.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2, ease: 'easeInOut' }}
                  className="flex items-center justify-center"
                >
                  <Link href="/sign-up">
                    <Button className="relative text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer">
                      <span className="relative z-10 transition-all duration-500">
                        Analysez votre CV gratuitement
                      </span>
                      <span className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                        <ArrowUpRight size={16} />
                      </span>
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES (feature-02 style — 3 cards minimal) ===== */}
      <section id="fonctionnalites">
        <div className="lg:py-20 sm:py-16 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex flex-col gap-8 md:gap-16">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="flex flex-col items-center justify-center gap-4 max-w-lg mx-auto"
              >
                <Badge
                  variant="outline"
                  className="px-3 py-1 h-auto text-sm"
                >
                  Comment ca marche
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold text-center tracking-[-1px]">
                  Trois etapes pour decrocher votre emploi en Suisse
                </h2>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 },
                  },
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[
                  {
                    icon: BarChart3,
                    title: 'Analysez votre CV',
                    content:
                      'Deposez votre CV. Notre IA evalue votre profil selon les criteres du marche suisse : photo, diplomes, terminologie, langues CECR.',
                  },
                  {
                    icon: Briefcase,
                    title: 'Trouvez les bonnes offres',
                    content:
                      'Plus de 20 000 offres en Suisse romande, filtrees par canton, contrat et secteur. Score de compatibilite IA pour chaque annonce.',
                  },
                  {
                    icon: FileText,
                    title: 'Postulez avec un dossier complet',
                    content:
                      'CV suisse 2 pages, lettre de motivation VOUS-MOI-NOUS, references, diplomes — assembles en un dossier PDF professionnel.',
                  },
                ].map((value, index) => (
                  <motion.div
                    key={index}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 30,
                        filter: 'blur(4px)',
                      },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                      },
                    }}
                    transition={{
                      duration: 0.8,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                  >
                    <Card className="py-10 h-full border-t-4 border-t-transparent transition-all duration-300 hover:border-t-primary hover:shadow-lg">
                      <CardContent className="px-8 flex flex-col gap-6">
                        <value.icon
                          className="w-8 h-8 text-primary"
                          strokeWidth={1.2}
                        />
                        <div className="flex flex-col gap-3">
                          <h6 className="text-xl font-semibold">
                            {value.title}
                          </h6>
                          <p className="text-base font-normal text-muted-foreground">
                            {value.content}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="flex flex-col items-center justify-center gap-5"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Asterisk size={16} />
                  <p className="font-normal text-sm">
                    Rejoint par plus de 1 200 frontaliers en Suisse romande
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING (pricing-01 style — 2 plans side by side) ===== */}
      <section className="bg-background py-10 xl:py-0">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 xl:px-16 lg:py-20 sm:py-16 py-8">
          <div className="flex flex-col gap-8 md:gap-12 justify-center items-center w-full">
            <div className="flex flex-col gap-4 justify-center items-center animate-in fade-in slide-in-from-top-8 duration-700 ease-in-out">
              <Badge
                variant="outline"
                className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7"
              >
                Tarifs
              </Badge>
              <div className="max-w-md mx-auto text-center">
                <h2 className="text-foreground text-3xl sm:text-5xl font-medium">
                  Simple et transparent
                </h2>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-center grow gap-6 w-full">
              {[
                {
                  bg: 'bg-indigo-500/10',
                  name: 'Gratuit',
                  desc: 'Pour decouvrir Kandid et analyser votre CV',
                  price: 0,
                  cta: 'Commencer gratuitement',
                  features: [
                    'Analyse CV suisse',
                    'Score de compatibilite',
                    'Recherche d\'emploi',
                    'Offres sauvegardees',
                  ],
                },
                {
                  bg: 'bg-violet-400/20',
                  name: 'Pro',
                  desc: 'Dossier de candidature complet genere par IA',
                  price: 29,
                  cta: 'Passer a Pro',
                  features: [
                    'Tout le plan Gratuit',
                    'CV suisse IA (2 pages)',
                    'Lettre de motivation IA',
                    'Dossier PDF complet',
                    'Candidatures illimitees',
                    'Support prioritaire',
                  ],
                },
              ].map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 80 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.2,
                    duration: 0.6,
                    ease: 'easeInOut',
                  }}
                  className="w-full sm:w-fit"
                >
                  <Card
                    className={`${plan.bg} p-8 sm:p-10 rounded-2xl ring-0 w-full sm:w-fit`}
                  >
                    <CardContent className="flex flex-col sm:flex-row gap-6 md:gap-10 items-start self-stretch px-0 h-full w-full">
                      <div className="flex flex-col items-start justify-between self-stretch gap-6">
                        <div className="flex flex-col gap-3">
                          <Badge className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7">
                            {plan.name}
                          </Badge>
                          <p className="text-sm font-normal text-muted-foreground max-w-56">
                            {plan.desc}
                          </p>
                        </div>
                        <div className="flex flex-col gap-4">
                          <p className="text-4xl sm:text-5xl font-semibold text-card-foreground flex items-end">
                            {plan.price} CHF
                            <span className="text-base font-normal text-muted-foreground">
                              /mois
                            </span>
                          </p>
                          <Link href="/sign-up">
                            <Button className="relative bg-white hover:bg-white hover:text-black dark:hover:text-black text-black text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer">
                              <span className="relative z-10 transition-all duration-500">
                                {plan.cta}
                              </span>
                              <div className="absolute right-1 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                                <ArrowUpRight size={16} />
                              </div>
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <Separator
                        orientation="vertical"
                        className="hidden sm:block"
                      />
                      <Separator
                        orientation="horizontal"
                        className="sm:hidden block"
                      />
                      <div className="flex flex-col items-start gap-3 grow">
                        <p className="text-card-foreground text-base sm:text-xl font-normal sm:font-medium">
                          Inclus
                        </p>
                        <ul className="flex flex-col items-start self-stretch gap-3">
                          {plan.features.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-3 text-card-foreground text-base font-normal tracking-normal"
                            >
                              <Check size={16} aria-hidden="true" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Beta gratuite — Acces complet a toutes les fonctionnalites
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA (cta-01 style — minimal centered) ===== */}
      <section>
        <div className="sm:py-20 py-8">
          <div className="max-w-7xl mx-auto sm:px-16 px-4">
            <div className="relative overflow-hidden min-h-96 flex items-center justify-center px-6 border border-border rounded-3xl before:absolute before:w-full before:h-4/5 before:bg-linear-to-r before:from-indigo-100 before:from-15% before:via-white before:via-55% before:to-violet-100 before:to-90% before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-indigo-400/10 dark:before:from-40% dark:before:via-black dark:before:via-55% dark:before:to-violet-300/10 dark:before:to-60% dark:before:rounded-full dark:before:-z-10">
              <motion.div
                initial={{ y: '5%', opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="flex flex-col gap-6 items-center mx-auto"
              >
                <div className="flex flex-col gap-3 items-center text-center">
                  <h2 className="text-3xl md:text-5xl font-medium">
                    Pret a decrocher votre emploi en Suisse ?
                  </h2>
                  <p className="max-w-2xl mx-auto text-muted-foreground">
                    Rejoignez les frontaliers qui ont deja optimise leur
                    candidature avec Kandid. Analyse gratuite, resultats
                    immediats.
                  </p>
                </div>
                <Link href="/sign-up">
                  <Button className="relative text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden hover:bg-primary/80 cursor-pointer">
                    <span className="relative z-10 transition-all duration-500">
                      Commencer gratuitement
                    </span>
                    <div className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                      <ArrowUpRight size={16} />
                    </div>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
