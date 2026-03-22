// @ts-nocheck
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Flame, LucideIcon, Target, ChartPie, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const Pricing = () => {
  const pricingCardVariants = {
    hidden: {
      opacity: 0,
      x: -60,
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.25,
        duration: 0.6,
        ease: "easeInOut",
      },
    }),
  };

  type PricingPlan = {
    plan_name: string;
    plan_tag?: string;
    plan_descp: string;
    plan_price: number;
    plan_currency: string;
    plan_period: string;
    plan_feature: { feature: string; check: boolean }[];
    plan_icon: LucideIcon;
    plan_cta: string;
    plan_href: string;
  };

  const pricingData: PricingPlan[] = [
    {
      plan_name: "Gratuit",
      plan_descp: "Analysez votre CV et trouvez des offres adaptees au marche suisse.",
      plan_price: 0,
      plan_currency: "CHF",
      plan_period: "/mois",
      plan_feature: [
        { feature: "Analyse CV suisse", check: true },
        { feature: "Score de compatibilite", check: true },
        { feature: "20 000+ offres d'emploi", check: true },
        { feature: "Offres sauvegardees", check: true },
        { feature: "Dossier PDF complet", check: false },
      ],
      plan_icon: Target,
      plan_cta: "Commencer gratuitement",
      plan_href: "/sign-up",
    },
    {
      plan_name: "Pro",
      plan_tag: "Recommande",
      plan_descp: "Generez un dossier de candidature complet avec l'IA.",
      plan_price: 29,
      plan_currency: "CHF",
      plan_period: "/mois",
      plan_feature: [
        { feature: "Tout le plan Gratuit", check: true },
        { feature: "CV suisse IA (2 pages)", check: true },
        { feature: "Lettre de motivation IA", check: true },
        { feature: "Dossier PDF complet", check: true },
        { feature: "Candidatures illimitees", check: true },
        { feature: "Support prioritaire", check: true },
      ],
      plan_icon: ChartPie,
      plan_cta: "Passer a Pro",
      plan_href: "/sign-up",
    },
  ];

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 xl:px-16 py-12 flex flex-col gap-8 md:gap-12 items-center justify-center">
        <div className="flex flex-col gap-6 items-center justify-center max-w-3xl">
          <div className="flex flex-col gap-3 text-center items-center justify-center ">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              Simple et transparent
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl font-normal">
              Choisissez le plan qui correspond a vos besoins. Pas de frais caches.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            variants={pricingCardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="h-full"
          >
            <Card className="relative py-4 rounded-2xl border-none bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 object-cover bg-center h-full w-full bg-cover bg-no-repeat justify-end min-h-150">
              <CardContent className="px-4">
                <div className="p-8 bg-background rounded-xl flex flex-col gap-10">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold text-foreground">Kandid</span>
                      <span className="bg-amber-300 rounded-full px-3 py-1 text-foreground text-sm font-medium">
                        BETA
                      </span>
                    </div>
                    <p className="text-2xl font-normal text-foreground">
                      Beta gratuite — <strong>Acces complet a toutes les fonctionnalites</strong>
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Link href="/sign-up" className="w-full">
                      <Button className="relative overflow-hidden group w-full py-3 h-full rounded-full font-medium text-base hover:cursor-pointer border border-primary transition-all">
                        <span className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-950 rounded-full scale-0 transition-transform duration-700 ease-in-out group-hover:scale-[18]" />
                        <span className="relative z-10 transition-colors duration-500 group-hover:text-gray-950 dark:group-hover:text-white">
                          Commencer gratuitement
                        </span>
                      </Button>
                    </Link>
                    <span className="text-muted-foreground text-sm font-normal">
                      Sans engagement, sans carte de credit.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          {pricingData.map((item, index) => {
            return (
              <motion.div
                key={index}
                variants={pricingCardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={index + 1}
                className="h-full max-lg:last:col-span-full"
              >
                <Card className="py-8 rounded-2xl max-lg:last:col-span-full h-full">
                  <CardContent className="px-8">
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between gap-2">
                          <item.plan_icon size={32} />
                          {item.plan_tag && (
                            <div className="flex items-center gap-1 py-1 px-3 bg-teal-400 text-white rounded-full w-fit">
                              <Flame size={16} />
                              <span className="text-sm font-medium">
                                {item.plan_tag}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <h3 className="text-2xl font-semibold text-foreground">
                            {item.plan_name}
                          </h3>
                          <p className="text-muted-foreground text-lg font-normal">
                            {item.plan_descp}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-medium text-foreground">
                          {item.plan_price} {item.plan_currency}
                        </span>
                        <span className="text-muted-foreground text-base font-normal">
                          {item.plan_period}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-px bg-border my-8" />
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-3">
                        {item.plan_feature.map((feature, index) => {
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-muted-foreground"
                            >
                              {feature?.check ? (
                                <Check size={20} />
                              ) : (
                                <X size={20} />
                              )}
                              <p className="text-base">{feature?.feature}</p>
                            </div>
                          );
                        })}
                      </div>
                      <Link href={item.plan_href}>
                        <Button className="relative overflow-hidden group w-full py-3 h-full rounded-full font-medium text-base hover:cursor-pointer border border-primary transition-all">
                          <span className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-950 rounded-full scale-0 transition-transform duration-700 ease-in-out group-hover:scale-[18]" />
                          <span className="relative z-10 transition-colors duration-500 group-hover:text-gray-950 dark:group-hover:text-white">
                            {item.plan_cta}
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
