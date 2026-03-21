import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions Legales — Kandid',
  description:
    'Mentions legales de la plateforme Kandid. Editeur, hebergeur et informations de contact.',
};

export default function LegalPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Mentions Legales
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Derniere mise a jour : 21 mars 2026
        </p>

        <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
          {/* Editeur */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Editeur du site
            </h2>
            <p className="mb-3">
              Le site{' '}
              <span className="font-medium text-gray-900">kandid.app</span> est
              edite par :
            </p>
            <ul className="space-y-1">
              <li>
                <span className="font-medium text-gray-900">
                  Kandid SAS
                </span>{' '}
                (societe par actions simplifiee)
              </li>
              <li>Capital social : 1 000 euros</li>
              <li>
                Siege social : 10 rue de la Paix, 75002 Paris, France
              </li>
              <li>RCS Paris : B 123 456 789 (numero provisoire)</li>
              <li>N. TVA intracommunautaire : FR 12 123456789</li>
              <li>
                Directeur de la publication : [Nom du dirigeant]
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              2. Contact
            </h2>
            <ul className="space-y-1">
              <li>
                E-mail :{' '}
                <a
                  href="mailto:contact@kandid.app"
                  className="text-indigo-600 hover:text-indigo-500 underline"
                >
                  contact@kandid.app
                </a>
              </li>
              <li>
                Site :{' '}
                <span className="font-medium text-gray-900">kandid.app</span>
              </li>
            </ul>
          </div>

          {/* Hebergement */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. Hebergement
            </h2>
            <p className="mb-3">Le site est heberge par :</p>
            <ul className="space-y-1">
              <li>
                <span className="font-medium text-gray-900">
                  Vercel Inc.
                </span>
              </li>
              <li>340 S Lemon Ave #4133, Walnut, CA 91789, Etats-Unis</li>
              <li>
                Site :{' '}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500 underline"
                >
                  vercel.com
                </a>
              </li>
            </ul>
          </div>

          {/* Propriete intellectuelle */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              4. Propriete intellectuelle
            </h2>
            <p>
              L&apos;ensemble du contenu du site (textes, images, graphismes,
              logo, icones, logiciels) est la propriete de Kandid SAS ou de ses
              partenaires et est protege par les lois francaises et
              internationales relatives a la propriete intellectuelle. Toute
              reproduction, representation, modification ou exploitation non
              autorisee est interdite.
            </p>
          </div>

          {/* Donnees personnelles */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              5. Donnees personnelles
            </h2>
            <p>
              Le traitement des donnees personnelles est decrit dans notre{' '}
              <a
                href="/privacy"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                Politique de confidentialite
              </a>
              .
            </p>
            <p className="mt-3">
              Conformement au RGPD, vous disposez d&apos;un droit d&apos;acces,
              de rectification et de suppression de vos donnees. Pour exercer ces
              droits, contactez-nous a{' '}
              <a
                href="mailto:privacy@kandid.app"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                privacy@kandid.app
              </a>
              .
            </p>
          </div>

          {/* Cookies */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              6. Cookies
            </h2>
            <p>
              Le site utilise des cookies necessaires au fonctionnement du
              service. Des cookies d&apos;analyse peuvent etre utilises avec
              votre consentement. Pour plus d&apos;informations, consultez notre{' '}
              <a
                href="/privacy"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                Politique de confidentialite
              </a>
              .
            </p>
          </div>

          {/* Loi applicable */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              7. Loi applicable
            </h2>
            <p>
              Les presentes mentions legales sont soumises au droit francais.
              Tout litige sera de la competence exclusive des tribunaux de Paris.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
