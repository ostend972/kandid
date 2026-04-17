import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="p-4 pt-0">
      <div className="relative h-[calc(100vh-92px)] w-full flex items-end">
        <video
          src="/hero-video.webm"
          loop
          playsInline
          autoPlay
          muted
          poster=""
          className="absolute top-0 left-0 w-full h-full object-cover rounded-3xl"
        />
        <div className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none bg-linear-to-t from-gray-950 to-50% to-gray-950/0" />
        <div className="relative z-10 flex flex-col gap-6 items-start justify-start max-w-7xl w-full mx-auto xl:px-16 lg:px-8 px-4 py-6 sm:py-8 md:py-16 text-left">
          <div className="max-w-3xl flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-medium text-white">
                Votre CV francais ne passe pas les filtres ATS en Suisse
              </h1>
              <p className="text-base sm:text-lg font-normal text-white/50 max-w-xl">
                En tant que frontalier, votre candidature est rejetee avant meme d&apos;etre lue. Kandid analyse votre CV avec l&apos;IA, identifie les ecarts avec les normes suisses et genere un dossier de candidature adapte — gratuitement.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-4">
              <Link href="/sign-up">
                <Button className="px-5 py-2.5 h-auto bg-background hover:bg-background/80 rounded-full text-foreground text-sm font-medium cursor-pointer">
                  Analysez votre CV gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
