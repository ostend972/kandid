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
import Link from "next/link";

const avatars = [
  { src: "https://images.shadcnspace.com/assets/profiles/rough.webp", alt: "Membre equipe Kandid", fallback: "CN" },
  { src: "https://images.shadcnspace.com/assets/profiles/jessica.webp", alt: "Membre equipe Kandid", fallback: "VC" },
  { src: "https://images.shadcnspace.com/assets/profiles/jenny.webp", alt: "Membre equipe Kandid", fallback: "NX" },
  { src: "https://images.shadcnspace.com/assets/profiles/albert.webp", alt: "Membre equipe Kandid", fallback: "NX" },
];

const FAQ_DATA = [
  {
    question: "La beta gratuite donne-t-elle acces a tout ?",
    answer:
      "Oui. Pendant la phase beta, tous les utilisateurs ont acces a l'integralite des fonctionnalites Pro : analyse CV, recherche d'emploi, generation de CV suisse, lettre de motivation, dossier PDF complet. Aucune carte de credit requise.",
  },
  {
    question: "Quand le plan Pro deviendra-t-il payant ?",
    answer:
      "La beta gratuite durera jusqu'a ce que le produit soit stabilise. Vous serez prevenu a l'avance par email avant tout changement de tarification. Les utilisateurs beta beneficieront d'un tarif preferentiel.",
  },
  {
    question: "Puis-je annuler a tout moment ?",
    answer:
      "Oui. Kandid fonctionne sans engagement. Vous pouvez arreter d'utiliser le service a tout moment. Aucun frais cache, aucune periode d'engagement minimale.",
  },
  {
    question: "Que comprend le dossier de candidature complet ?",
    answer:
      "Le dossier inclut : un CV suisse de 2 pages adapte a chaque offre, une lettre de motivation structuree (methode VOUS-MOI-NOUS), une page de references professionnelles, vos diplomes et certificats — le tout assemble en un seul PDF professionnel.",
  },
  {
    question: "Mes donnees sont-elles en securite ?",
    answer:
      "Oui. Vos donnees sont stockees de maniere securisee sur Supabase (infrastructure europeenne). Nous sommes conformes au RGPD et a la loi federale suisse sur la protection des donnees (LPD). Vos documents ne sont jamais partages avec des tiers.",
  },
];

export default function FaqPricing() {
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
              Questions sur les tarifs et la beta
            </h2>
          </div>
        </div>
        <div className="flex md:flex-row flex-col md:gap-10 gap-6">
          <div className="max-w-sm w-full">
            <div className="md:px-8 px-6 md:py-10 py-8 rounded-2xl border space-y-8">
              <div className="space-y-6!">
                <h3 className="text-2xl font-medium text-foreground">
                  Une question ? Notre equipe est la pour vous aider.
                </h3>
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
                <Link href="mailto:contact@kandid.ch">
                  <Button className="flex gap-2 items-center w-full rounded-full min-h-12 cursor-pointer">
                    <Calendar className="size-4.5" />
                    Contactez-nous
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    variant="outline"
                    className="flex gap-2 items-center w-full rounded-full min-h-12 cursor-pointer"
                  >
                    <Mail className="size-4.5" />
                    Essayer gratuitement
                  </Button>
                </Link>
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
