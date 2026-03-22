import Testimonials from "@/components/shadcn-space/blocks/testimonial-05/testimonial";
import type { TestimonialType } from "@/components/shadcn-space/blocks/testimonial-05/testimonial";

export const TestimonialsData: TestimonialType[] = [
  {
    id: 1,
    quote:
      "Grace a Kandid, j'ai enfin compris pourquoi mes candidatures n'aboutissaient pas. Mon CV etait au format francais !",
    name: "Marie D.",
    role: "Frontaliere a Geneve",
    image: "https://api.dicebear.com/9.x/initials/svg?seed=MD&backgroundColor=0ea5e9",
    theme: "light",
    cardColor: "bg-teal-400/20",
  },
  {
    id: 2,
    quote:
      "Le dossier de candidature genere par l'IA m'a fait gagner des heures. J'ai decroche un entretien en 2 semaines.",
    name: "Thomas L.",
    role: "Consultant IT, Vaud",
    image: "https://api.dicebear.com/9.x/initials/svg?seed=TL&backgroundColor=6366f1",
    theme: "dark",
    cardColor: "bg-primary dark:bg-white",
  },
  {
    id: 3,
    quote:
      "L'analyse CV m'a montre que mes diplomes n'avaient pas d'equivalence suisse. Kandid a tout corrige automatiquement.",
    name: "Sophie M.",
    role: "Comptable, Neuchatel",
    image: "https://api.dicebear.com/9.x/initials/svg?seed=SM&backgroundColor=10b981",
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
