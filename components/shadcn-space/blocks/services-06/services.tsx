"use client";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Services = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const services = [
    {
      key: "cv",
      label: "CV suisse",
      caption: "01 - CV adapte",
      title: "CV adapte au marche suisse",
      description:
        "Photo professionnelle, equivalences de diplomes, terminologie suisse, niveaux CECR.",
      departmentsLeft: [
        "Photo professionnelle",
        "Equivalences de diplomes",
        "Format 2 pages",
      ],
      departmentsRight: [
        "Terminologie suisse",
        "Niveaux de langue CECR",
        "Mise en page optimisee",
      ],
    },
    {
      key: "matching",
      label: "Matching IA",
      caption: "02 - Matching",
      title: "Matching IA avec les offres",
      description:
        "Score de compatibilite calcule pour chaque annonce selon votre profil.",
      departmentsLeft: ["Score de compatibilite", "Filtrage par canton"],
      departmentsRight: ["Filtrage par secteur", "Filtrage par contrat"],
    },
    {
      key: "dossier",
      label: "Dossier complet",
      caption: "03 - Dossier",
      title: "Dossier de candidature complet",
      description:
        "CV, lettre de motivation, references, diplomes — un seul PDF professionnel.",
      departmentsLeft: ["CV suisse 2 pages", "Lettre de motivation"],
      departmentsRight: ["Page de references", "Assemblage PDF"],
    },
    {
      key: "gratuit",
      label: "Beta gratuite",
      caption: "04 - Beta",
      title: "Gratuit pendant la beta",
      description:
        "Acces complet a toutes les fonctionnalites sans engagement.",
      departmentsLeft: ["Analyse CV gratuite", "Recherche d'emploi"],
      departmentsRight: ["Dossier complet", "Sans carte de credit"],
    },
  ];

  return (
    <section ref={sectionRef}>
      <div className="md:py-20 py-10 flex flex-col md:gap-16 gap-8">
        <div className="mx-auto max-w-7xl w-full md:px-16 px-4 flex flex-col md:gap-10 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="flex flex-col justify-center text-center gap-4 max-w-3xl mx-auto"
          >
            <p className="uppercase text-sm font-medium text-foreground">
              Kandid
            </p>
            <h2 className="text-3xl md:text-5xl font-medium text-foreground">
              Pourquoi les frontaliers choisissent Kandid
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <Tabs
              defaultValue="cv"
              className="w-full flex flex-col gap-10 overflow-hidden"
            >
              {/* Tabs header */}

              <TabsList className="bg-transparent p-0 border-b  rounded-none mx-auto shadow-none">
                {services.map((service) => (
                  <TabsTrigger
                    key={service.key}
                    value={service.key}
                    className="rounded-none px-4 pb-5 text-base font-medium text-muted-foreground dark:bg-transparent! border-b border-transparent shadow-none! dark:border-x-0! dark:border-t-0! focus-visible:ring-0 dark:data-[state=active]:bg-transparent data-[state=active]:text-foreground group-data-[variant=default]/tabs-list:data-active:border-b group-data-[variant=default]/tabs-list:data-active:border-b-foreground dark:group-data-[variant=default]/tabs-list:data-active:border-b-white! data-[state=active]:shadow-none! hover:cursor-pointer"
                  >
                    {service.label}
                  </TabsTrigger>
                ))}
              </TabsList>


              {/* Tabs content */}
              {services.map((service) => (
                <TabsContent key={service.key} value={service.key}>
                  <div className="flex md:flex-row flex-col justify-between gap-6 md:gap-12 items-center md:rounded-2xl overflow-hidden bg-muted">
                    {/* Gradient placeholder instead of external image */}
                    <div className="overflow-hidden md:max-w-xl w-full md:rounded-none rounded-2xl">
                      <div className="w-full h-64 md:h-80 bg-gradient-to-br from-blue-100 via-slate-100 to-blue-50 dark:from-blue-950 dark:via-slate-900 dark:to-blue-900 flex items-center justify-center">
                        <span className="text-4xl font-bold text-blue-300 dark:text-blue-700 select-none">K</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-10 w-full">
                      <div className="space-y-6 lg:max-w-md w-full">
                        <div className="space-y-4">
                          <p className="text-sm text-foreground font-medium">
                            {service.caption}
                          </p>

                          <h2 className="md:text-3xl text-2xl font-medium">
                            {service.title}
                          </h2>

                          <p className="text-muted-foreground text-base">
                            {service.description}
                          </p>
                        </div>

                        <div className="flex flex-col gap-4">
                          <p className="text-sm text-foreground">
                            Details
                          </p>
                          <div className="grid sm:grid-cols-2 md:gap-6 gap-2">
                            <ul className="space-y-2 text-sm">
                              {service.departmentsLeft.map((item) => (
                                <li
                                  key={item}
                                  className="flex gap-2.5 text-sm text-foreground items-center"
                                >
                                  <span className="h-1 w-1 rounded-full bg-primary/50"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                            <ul className="space-y-2 text-sm">
                              {service.departmentsRight.map((item) => (
                                <li
                                  key={item}
                                  className="flex gap-2.5 text-sm text-foreground items-center"
                                >
                                  <span className="h-1 w-1 rounded-full bg-primary/50"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Link href="/sign-up">
                          <Button className="p-5 rounded-md hover:cursor-pointer hover:bg-primary/80">Commencer</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Services;
