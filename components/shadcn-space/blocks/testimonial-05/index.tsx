import Testimonials from "@/components/shadcn-space/blocks/testimonial-05/testimonial";
import type { TestimonialType } from "@/components/shadcn-space/blocks/testimonial-05/testimonial";

export const TestimonialsData: TestimonialType[] = [
  {
    id: 1,
    quote:
      "Grace a Kandid, j'ai enfin compris pourquoi mes candidatures n'aboutissaient pas. Mon CV etait au format francais !",
    name: "Marie D.",
    role: "Frontaliere, Geneve",
    image: "https://images.shadcnspace.com/assets/profiles/albert.webp",
    theme: "light",
    cardColor: "bg-teal-400/20",
  },
  {
    id: 2,
    quote:
      "Le dossier de candidature genere par l'IA m'a fait gagner des heures. J'ai decroche un entretien en 2 semaines.",
    name: "Thomas L.",
    role: "Consultant IT, Vaud",
    image: "https://images.shadcnspace.com/assets/profiles/rough.webp",
    theme: "dark",
    cardColor: "bg-primary dark:bg-white",
  },
  {
    id: 3,
    quote:
      "L'analyse CV m'a montre que mes diplomes n'avaient pas d'equivalence suisse. Kandid a tout corrige automatiquement.",
    name: "Sophie M.",
    role: "Comptable, Neuchatel",
    image: "https://images.shadcnspace.com/assets/profiles/jenny.webp",
    theme: "light",
    cardColor: "bg-muted",
  },
];

export default function TestimonialsDemo() {
  return (
    <>
      <Testimonials testimonials={TestimonialsData} />
    </>
  );
}
