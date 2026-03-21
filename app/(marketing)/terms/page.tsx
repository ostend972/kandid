import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Generales d\'Utilisation — Kandid',
  description:
    'Conditions generales d\'utilisation de la plateforme Kandid. Analyse de CV et recherche d\'emploi en Suisse.',
};

export default function TermsPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Conditions Generales d&apos;Utilisation
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Derniere mise a jour : 21 mars 2026
        </p>

        <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
          {/* Article 1 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 1 — Description du service
            </h2>
            <p>
              Kandid est une plateforme en ligne qui permet aux utilisateurs
              d&apos;analyser leur CV en vue d&apos;une candidature sur le marche
              de l&apos;emploi suisse, de consulter des offres d&apos;emploi en
              Suisse romande, et de beneficier d&apos;un matching automatise
              entre leur profil et les postes disponibles.
            </p>
            <p className="mt-3">
              Le service est accessible a l&apos;adresse{' '}
              <span className="font-medium text-gray-900">kandid.app</span>{' '}
              apres creation d&apos;un compte utilisateur.
            </p>
          </div>

          {/* Article 2 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 2 — Acceptation des conditions
            </h2>
            <p>
              L&apos;utilisation de la plateforme Kandid implique
              l&apos;acceptation pleine et entiere des presentes conditions
              generales d&apos;utilisation. Si vous n&apos;acceptez pas ces
              conditions, vous ne devez pas utiliser le service.
            </p>
            <p className="mt-3">
              Nous nous reservons le droit de modifier les presentes conditions a
              tout moment. Les utilisateurs seront informes de toute
              modification substantielle par e-mail ou via une notification sur
              la plateforme.
            </p>
          </div>

          {/* Article 3 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 3 — Inscription et compte utilisateur
            </h2>
            <p className="mb-3">
              Pour utiliser Kandid, vous devez creer un compte en fournissant
              des informations exactes et a jour. Vous etes responsable :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                De la confidentialite de vos identifiants de connexion.
              </li>
              <li>
                De l&apos;exactitude des informations fournies lors de
                l&apos;inscription et dans votre CV.
              </li>
              <li>
                De toute activite effectuee depuis votre compte.
              </li>
            </ul>
            <p className="mt-3">
              Vous vous engagez a nous notifier immediatement toute utilisation
              non autorisee de votre compte.
            </p>
          </div>

          {/* Article 4 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 4 — Obligations de l&apos;utilisateur
            </h2>
            <p className="mb-3">
              En utilisant Kandid, vous vous engagez a :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Fournir des informations exactes et veridiques dans votre CV et
                votre profil.
              </li>
              <li>
                Ne pas utiliser le service a des fins illegales, frauduleuses ou
                contraires aux bonnes moeurs.
              </li>
              <li>
                Ne pas tenter de perturber le fonctionnement de la plateforme
                (attaques, scraping abusif, injection de code, etc.).
              </li>
              <li>
                Ne pas creer plusieurs comptes pour contourner les limitations du
                plan gratuit.
              </li>
              <li>
                Respecter les droits de propriete intellectuelle de Kandid et des
                tiers.
              </li>
            </ul>
          </div>

          {/* Article 5 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 5 — Propriete intellectuelle
            </h2>
            <p>
              L&apos;ensemble des elements constituant la plateforme Kandid
              (textes, graphismes, logiciels, algorithmes, design, marques) sont
              la propriete exclusive de Kandid ou de ses partenaires et sont
              proteges par les lois relatives a la propriete intellectuelle.
            </p>
            <p className="mt-3">
              Le contenu de votre CV reste votre propriete. En important votre CV
              sur Kandid, vous nous accordez une licence limitee, non exclusive et
              revocable pour traiter et analyser votre document dans le cadre
              exclusif du service.
            </p>
          </div>

          {/* Article 6 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 6 — Service en version beta
            </h2>
            <p>
              Kandid est actuellement propose en version beta. Le service est
              fourni &laquo;&nbsp;en l&apos;etat&nbsp;&raquo; et peut comporter
              des bugs, erreurs ou interruptions. Nous ne garantissons pas la
              disponibilite continue ou l&apos;exactitude absolue des resultats
              fournis par nos algorithmes d&apos;analyse.
            </p>
            <p className="mt-3">
              Pendant la periode beta, l&apos;acces a l&apos;ensemble des
              fonctionnalites est gratuit. Les tarifs definitifs seront
              communiques avant la fin de la phase beta.
            </p>
          </div>

          {/* Article 7 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 7 — Limitation de responsabilite
            </h2>
            <p className="mb-3">Kandid ne saurait etre tenu responsable :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Des decisions prises par l&apos;utilisateur sur la base des
                analyses et recommandations fournies par la plateforme.
              </li>
              <li>
                De l&apos;exactitude, de l&apos;exhaustivite ou de
                l&apos;actualite des offres d&apos;emploi affichees, celles-ci
                etant collectees aupres de sources tierces.
              </li>
              <li>
                Des dommages indirects, pertes de donnees, pertes de chance ou
                manque a gagner resultant de l&apos;utilisation du service.
              </li>
              <li>
                Des interruptions de service dues a des travaux de maintenance,
                des pannes ou des evenements de force majeure.
              </li>
            </ul>
            <p className="mt-3">
              En tout etat de cause, la responsabilite de Kandid est limitee au
              montant des sommes eventuellement versees par l&apos;utilisateur au
              cours des 12 derniers mois.
            </p>
          </div>

          {/* Article 8 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 8 — Resiliation
            </h2>
            <p>
              Vous pouvez supprimer votre compte a tout moment depuis la page{' '}
              <span className="font-medium text-gray-900">Parametres</span> de
              votre tableau de bord. La suppression entraine l&apos;effacement
              definitif de toutes vos donnees.
            </p>
            <p className="mt-3">
              Nous nous reservons le droit de suspendre ou de supprimer votre
              compte en cas de violation des presentes conditions, sans preavis
              ni indemnite.
            </p>
          </div>

          {/* Article 9 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 9 — Protection des donnees
            </h2>
            <p>
              Le traitement de vos donnees personnelles est regi par notre{' '}
              <a
                href="/privacy"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                Politique de confidentialite
              </a>
              , qui fait partie integrante des presentes conditions.
            </p>
          </div>

          {/* Article 10 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 10 — Droit applicable et juridiction
            </h2>
            <p>
              Les presentes conditions generales sont regies par le droit
              francais. En cas de litige relatif a l&apos;interpretation ou a
              l&apos;execution des presentes conditions, les parties
              s&apos;efforceront de trouver une solution amiable. A defaut, le
              litige sera soumis aux tribunaux competents de Paris, France.
            </p>
          </div>

          {/* Article 11 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Article 11 — Contact
            </h2>
            <p>
              Pour toute question relative aux presentes conditions, vous pouvez
              nous contacter :
            </p>
            <ul className="mt-3 space-y-1">
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
        </div>
      </div>
    </section>
  );
}
