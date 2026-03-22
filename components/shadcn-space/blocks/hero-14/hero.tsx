import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="p-4 pt-0">
      <div className="relative h-[calc(100vh-92px)] w-full flex items-end overflow-hidden rounded-3xl">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src="/hero-video.webm" type="video/webm" />
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 w-full h-full pointer-events-none bg-linear-to-t from-gray-950 to-50% to-gray-950/0" />
        <div className="relative z-10 flex flex-col gap-6 items-start justify-start max-w-7xl w-full mx-auto xl:px-16 lg:px-8 px-4 py-6 sm:py-8 md:py-16 text-left">
          <div className="max-w-3xl flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-medium text-white">
                Votre CV francais ne fonctionne pas en Suisse
              </h1>
              <p className="text-base sm:text-lg font-normal text-white/60 max-w-xl">
                Decouvrez pourquoi vos candidatures echouent et obtenez un
                dossier adapte au marche suisse. Analyse IA gratuite.
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
