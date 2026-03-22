"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";

const Feature = () => {
  const features = [
    { label: "Photo professionnelle", active: false },
    { label: "Equivalences diplomes", active: false },
    { label: "Niveaux CECR", active: false },
    { label: "Terminologie suisse", active: false },
    { label: "Score ATS", active: true },
    { label: "CV 2 pages", active: false },
    { label: "Lettre VOUS-MOI-NOUS", active: false },
    { label: "Dossier PDF complet", active: false },
    { label: "References integrees", active: false },
    { label: "Export professionnel", active: false },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
      },
    },
  };

  return (
    <section>
      <div className="lg:py-20 sm:py-16 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto w-full px-4 lg:px-8 xl:px-16"
        >
          <div className="flex flex-col gap-8 md:gap-12">
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-semibold text-center"
            >
              Comment Kandid aide les frontaliers a decrocher un emploi en Suisse
            </motion.h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row lg:flex-col h-full gap-2 sm:gap-6">
                <motion.div variants={itemVariants} className="h-full">
                  <Card className="py-10 h-full shadow-xs">
                    <CardContent className="flex flex-col gap-4 sm:gap-8 px-10">
                      <img
                        src="https://images.shadcnspace.com/assets/svgs/feature-11-icon-1.svg"
                        alt="Icone analyse CV suisse"
                        width={32}
                        height={32}
                      />
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-semibold">
                          Analysez votre CV
                        </h3>
                        <p className="text-sm sm:text-lg font-normal text-muted-foreground">
                          Notre IA evalue votre profil selon les criteres
                          specifiques au marche suisse : photo, diplomes,
                          terminologie, niveaux CECR.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={itemVariants} className="h-full">
                  <Card className="py-10 h-full shadow-xs">
                    <CardContent className="flex flex-col gap-4 sm:gap-8 px-10">
                      <img
                        src="https://images.shadcnspace.com/assets/svgs/feature-11-icon-2.svg"
                        alt="Icone recherche offres emploi Suisse"
                        width={32}
                        height={32}
                      />
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-semibold">
                          Trouvez les bonnes offres
                        </h3>
                        <p className="text-sm sm:text-lg font-normal text-muted-foreground">
                          Plus de 20 000 offres en Suisse romande, filtrees par
                          canton, contrat et secteur. Score de compatibilite IA
                          pour chaque annonce.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              <motion.div variants={itemVariants}>
                <Card className="p-0 gap-0 shadow-xs overflow-hidden">
                  <CardHeader className="bg-sky-400/3 ps-8 py-10 pr-0">
                    <div className="flex flex-wrap gap-3 min-w-sm sm:min-w-2xl">
                      {features.map((item, index) => (
                        <Badge
                          key={index}
                          className={`h-auto [&>svg]:size-5! text-base font-medium text-muted-foreground bg-muted px-4 py-1.5 flex items-center gap-2 ${
                            item.active
                              ? "border border-blue-500 bg-background text-blue-500"
                              : ""
                          }`}
                        >
                          <CircleCheck
                            className={
                              item.active
                                ? "size-5 fill-blue-500 stroke-background"
                                : "size-5 fill-foreground/20 stroke-muted"
                            }
                          />
                          <span>{item.label}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 sm:gap-8 px-10 py-8 border-t border-border">
                    <img
                      src="https://images.shadcnspace.com/assets/svgs/feature-11-icon-3.svg"
                      alt="Icone dossier candidature complet"
                      width={32}
                      height={32}
                    />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-semibold">
                        Postulez avec un dossier complet
                      </h3>
                      <p className="text-sm sm:text-lg font-normal text-muted-foreground">
                        CV suisse 2 pages, lettre de motivation
                        VOUS-MOI-NOUS, references — assembles en un dossier PDF
                        professionnel pret a envoyer.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Feature;
