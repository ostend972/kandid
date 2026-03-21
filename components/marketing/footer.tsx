import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const legalLinks = [
  { href: '/privacy', label: 'Politique de confidentialite' },
  { href: '/terms', label: 'Conditions generales' },
  { href: '/legal', label: 'Mentions legales' },
];

const socialLinks = [
  { href: '#', label: 'LinkedIn' },
  { href: '#', label: 'Twitter' },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Kandid</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 max-w-xs">
              Votre CV adapte au marche suisse. Analyse ATS, offres d&apos;emploi et
              accompagnement pour les frontaliers.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Suivez-nous</h3>
            <ul className="mt-3 space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-sm text-gray-400">
          &copy; 2026 Kandid. Tous droits reserves.
        </p>
      </div>
    </footer>
  );
}
