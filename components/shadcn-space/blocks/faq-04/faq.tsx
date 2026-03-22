import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const avatars = [
  {
    src: "https://images.shadcnspace.com/assets/profiles/rough.webp",
    alt: "user",
    fallback: "CN",
  },
  {
    src: "https://images.shadcnspace.com/assets/profiles/jessica.webp",
    alt: "user",
    fallback: "VC",
  },
  {
    src: "https://images.shadcnspace.com/assets/profiles/jenny.webp",
    alt: "user",
    fallback: "NX",
  },
  {
    src: "https://images.shadcnspace.com/assets/profiles/albert.webp",
    alt: "user",
    fallback: "NX",
  },
];

const FAQ_DATA = [
  {
    question: "Pourquoi mon CV francais est-il rejete en Suisse ?",
    answer:
      "Le marche suisse attend un CV de 2 pages avec photo professionnelle, equivalences de diplomes (CFC, HES, Bachelor/Master), niveaux de langue certifies CECR (A1 a C2) et terminologie locale (contrat fixe au lieu de CDI). Un CV au format francais est souvent filtre automatiquement par les logiciels ATS des recruteurs suisses.",
  },
  {
    question: "Qu’est-ce qu’un frontalier et ai-je besoin d’un permis G ?",
    answer:
      "Un frontalier est un travailleur residant en France (ou dans un pays limitrophe) qui traverse la frontiere quotidiennement pour travailler en Suisse. Le permis G est delivre automatiquement apres signature du contrat de travail — vous n’avez pas besoin de l’obtenir avant de postuler.",
  },
  {
    question: "Kandid est-il vraiment gratuit ?",
    answer:
      "Oui. Pendant la phase beta, toutes les fonctionnalites sont accessibles gratuitement : analyse CV, recherche d’emploi parmi 20 000+ offres, et generation de dossier de candidature complet. Aucune carte de credit requise.",
  },
  {
    question: "Comment fonctionne le matching IA avec les offres d’emploi ?",
    answer:
      "L’algorithme de Kandid compare votre profil extrait du CV (competences, langues, experience, secteur) avec les exigences de chaque offre. Il attribue un score de compatibilite sur 100 et identifie les lacunes a combler pour maximiser vos chances.",
  },
  {
    question: "Quelles sont les differences entre un CV francais et un CV suisse ?",
    answer:
      "Un CV suisse doit contenir une photo professionnelle, mentionner la nationalite et la date de naissance, utiliser la terminologie locale (contrat fixe, CFC, HES), indiquer les niveaux de langue en CECR, et faire 2 pages. Les CV creatifs ou d’une seule page a la francaise ne sont pas adaptes au marche suisse.",
  },
];

export default function Faq() {
  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:py-24 py-8 flex flex-col md:gap-16 gap-8">
        <div>
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-10 duration-1000 delay-100 ease-in-out fill-mode-both">
            <Badge
              variant="outline"
              className="text-sm h-auto py-1 px-3 border-0 outline outline-border"
            >
              FAQs
            </Badge>
            <h2 className="text-3xl md:text-5xl not-last:md:text-5xl font-medium max-w-lg">
              Questions frequentes sur la recherche d'emploi en Suisse
            </h2>
          </div>
        </div>
        <div className="flex md:flex-row flex-col md:gap-10 gap-6">
          <div className="max-w-sm w-full">
            <div className="md:px-8 px-6 md:py-10 py-8 rounded-2xl border space-y-8">
              <div className="space-y-6!">
                <h4 className="text-2xl font-medium text-foreground">
                  Une question ? Notre equipe est la pour vous aider.
                </h4>
                <AvatarGroup>
                  {avatars.map((avatar, index) => (
                    <Avatar key={index} className="h-12 w-12">
                      <AvatarImage src={avatar.src} alt={avatar.alt} />
                      <AvatarFallback>{avatar.fallback}</AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
              </div>
              <div className="space-y-3!">
                <Button className="flex gap-2 items-center w-full rounded-full min-h-12 cursor-pointer">
                  <Calendar className="size-4.5" />
                  Contactez-nous
                </Button>
                <Button
                  variant="outline"
                  className="flex gap-2 items-center w-full rounded-full min-h-12 cursor-pointer"
                >
                  <Mail className="size-4.5" />
                  Analysez votre CV
                </Button>
              </div>
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full flex flex-col gap-6">
            {FAQ_DATA.map((faq, index) => (
              <AccordionItem
                key={`item-${index}`}
                value={`item-${index}`}
                className={cn(
                  "md:px-8 px-4 py-6 border border-border rounded-2xl flex flex-col gap-4 group/item data-[open]:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both",
                  index === 0 && "delay-100",
                  index === 1 && "delay-200",
                  index === 2 && "delay-300",
                  index === 3 && "delay-400",
                  index === 4 && "delay-500",
                )}
              >
                <AccordionTrigger className="relative p-0 pr-12 md:text-xl text-lg font-semibold hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden cursor-pointer">
                  <div className="flex xl:gap-16 gap-6 text-left">
                    {/* Number */}
                    <span className="shrink-0">{String(index + 1).padStart(2, "0")}</span>
                    {faq.question}
                  </div>

                  <PlusIcon className="absolute right-0 top-4 w-6 h-6 transition-transform duration-200 group-aria-expanded/accordion-trigger:hidden" />
                  <MinusIcon className="absolute right-0 top-4 w-6 h-6 transition-transform duration-200 hidden group-aria-expanded/accordion-trigger:inline" />
                </AccordionTrigger>
                <AccordionContent className="p-0 text-muted-foreground text-lg lg:max-w-2xl mx-auto xl:px-15 md:px-12 px-12">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
