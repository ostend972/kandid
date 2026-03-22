import Logo from "@/assets/logo/logo";
import { Separator } from "@/components/ui/separator";
import { Twitter, Linkedin, Instagram, Dribbble, ArrowRight } from "lucide-react";
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
    title: "Quick Links",
    links: [
      {
        title: "Shadcn UI Blocks & Templates",
        href: "#",
      },
      {
        title: "React Templates",
        href: "#",
      },
      {
        title: "Leadership Team",
        href: "#",
      },
      {
        title: "Our Vision & Mission",
        href: "#",
      },
      {
        title: "Shadcn Premium Components",
        href: "#",
      },
    ],
  },
  {
    title: "Media & Resources",
    links: [
      {
        title: "News / Press Release",
        href: "#",
      },
      {
        title: "Insights & Blogs",
        href: "#",
      },
      {
        title: "Media",
        href: "#",
      },
      {
        title: "Case Studies",
        href: "#",
      },
      {
        title: "Press Kit",
        href: "#",
      },
    ],
  },
  {
    title: "Our Services",
    links: [
      {
        title: "Web Design & Development",
        href: "#",
      },
      {
        title: "Search Engine Optimization & SEM",
        href: "#",
      },
      {
        title: "Mobile & Web Application",
        href: "#",
      },
      {
        title: "Branding & Identity",
        href: "#",
      },
      {
        title: "Digital Marketing",
        href: "#",
      },
    ],
  },
  {
    title: "Other",
    links: [
      {
        title: "Contact us",
        href: "#",
      },
      {
        title: "Careers",
        href: "#",
      },
      {
        title: "Events",
        href: "#",
      },
    ],
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
                <a href="#">
                  <Logo />
                </a>
              </div>
            </div>
            <div className="lg:col-span-6 col-span-12 grid sm:grid-cols-2 grid-cols-1 gap-6 gap-y-10">
              {footerSections.map(({ title, links }, index) => (
                <div key={index}>
                  <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                    <p className="text-base font-medium text-foreground">
                      {title}
                    </p>
                    <ul className="flex flex-col gap-3">
                      {links.map(({ title, href }) => (
                        <li key={title}>
                          <a
                            href={href}
                            className="text-sm font-normal text-muted-foreground hover:text-foreground duration-200"
                          >
                            {title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-3 col-span-12">
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <p className="text-sm text-muted-foreground">
                  Stay Connected
                </p>
                <h3 className="text-lg font-medium text-foreground">
                  Subscribe to our Newsletter for the latest news
                </h3>
                <form className="flex items-center gap-2">
                  <Input type="email" placeholder="Enter your email" className="py-2 px-4 h-9 shadow-xs rounded-full text-sm" />
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
              <p>©2026 Shadcn Space. All Rights Reserved.</p>
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              <a href="#" className="hover:text-foreground duration-200">
                Terms & Conditions
              </a>
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              <a href="#" className="hover:text-foreground duration-200">
                Privacy policy
              </a>
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              <a href="#" className="hover:text-foreground duration-200">
                Sitemap
              </a>
            </div>
            {/* social links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-foreground"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-foreground"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="#"
                className="text-foreground"
              >
                <Dribbble size={20} />
              </a>
              <a
                href="#"
                className="text-foreground"
              >
                <Instagram size={20} />
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
