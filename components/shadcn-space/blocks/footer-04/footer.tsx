import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Twitter, Linkedin, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SubFooter from "@/components/shadcn-space/blocks/footer-04/subfooter";

type FooterData = {
  title: string;
  links: {
    title: string;
    href: string;
  }[];
};

const footerSections: FooterData[] = [
  {
    title: "Liens rapides",
    links: [
      {
        title: "Analyse CV",
        href: "/sign-up",
      },
      {
        title: "Offres d'emploi",
        href: "/sign-up",
      },
      {
        title: "Tarifs",
        href: "/pricing",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      {
        title: "Politique de confidentialite",
        href: "/privacy",
      },
      {
        title: "Conditions d'utilisation",
        href: "/terms",
      },
      {
        title: "Mentions legales",
        href: "/legal",
      },
    ],
  },
  {
    title: "Suivez-nous",
    links: [],
  },
];

const Footer = () => {
  return (
    <footer className="lg:pt-20 sm:pt-16 pt-8">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto ">
        <div className="flex flex-col gap-6 sm:gap-12 md:mb-12 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 lg:gap-x-8 gap-y-10 px-6 xl:px-0">
            <div className="col-span-full lg:col-span-3">
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 text-sm font-bold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">K</div>
                  Kandid
                </Link>
                <p className="text-sm text-muted-foreground">
                  Kandid adapte votre candidature au marche suisse. Analyse CV, recherche d&apos;emploi et dossier de candidature complet.
                </p>
              </div>
            </div>
            <div className="lg:col-span-6 col-span-12 grid sm:grid-cols-2 grid-cols-1 gap-6 gap-y-10">
              {footerSections.map(({ title, links }, index) => (
                <div key={index}>
                  <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                    <p className="text-base font-medium text-foreground">
                      {title}
                    </p>
                    {links.length > 0 ? (
                      <ul className="flex flex-col gap-3">
                        {links.map(({ title, href }) => (
                          <li key={title}>
                            <Link
                              href={href}
                              className="text-sm font-normal text-muted-foreground hover:text-foreground duration-200"
                            >
                              {title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-4">
                        <a
                          href="https://twitter.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground duration-200"
                        >
                          <Twitter size={20} />
                        </a>
                        <a
                          href="https://linkedin.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground duration-200"
                        >
                          <Linkedin size={20} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-3 col-span-12">
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <p className="text-sm text-muted-foreground">
                  Restez informe
                </p>
                <h3 className="text-lg font-medium text-foreground">
                  Inscrivez-vous pour recevoir nos dernieres actualites
                </h3>
                <form className="flex items-center gap-2">
                  <Input type="email" placeholder="Votre email" className="py-2 px-4 h-9 shadow-xs rounded-full text-sm" />
                  <Button type="submit" className="rounded-full p-2.5 h-auto">
                    <ArrowRight width={16} height={16} />
                  </Button>
                </form>
              </div>
            </div>
          </div>
          <Separator orientation="horizontal" />
          <div className="flex items-center justify-between md:flex-nowrap flex-wrap gap-6">
            <div className="flex items-center flex-wrap gap-y-2 gap-x-3 text-sm font-normal text-muted-foreground animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
              <p>&copy;2026 Kandid. Tous droits reserves.</p>
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              <Link href="/terms" className="hover:text-foreground duration-200">
                Conditions d&apos;utilisation
              </Link>
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              <Link href="/privacy" className="hover:text-foreground duration-200">
                Politique de confidentialite
              </Link>
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              <Link href="/legal" className="hover:text-foreground duration-200">
                Mentions legales
              </Link>
            </div>
            {/* social links */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        <SubFooter />
      </div>
    </footer>
  );
};

export default Footer;
