import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialite — Kandid',
  description:
    'Politique de confidentialite de Kandid. Decouvrez comment nous collectons, utilisons et protegeons vos donnees personnelles.',
};

export default function PrivacyPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Politique de confidentialite
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Derniere mise a jour : 21 mars 2026
        </p>

        <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
          {/* Introduction */}
          <div>
            <p>
              La presente politique de confidentialite decrit la maniere dont
              Kandid (&laquo;&nbsp;nous&nbsp;&raquo;,
              &laquo;&nbsp;notre&nbsp;&raquo;) collecte, utilise et protege vos
              donnees personnelles lorsque vous utilisez notre plateforme
              accessible a l&apos;adresse{' '}
              <span className="font-medium text-gray-900">kandid.app</span>.
            </p>
            <p className="mt-3">
              Nous nous engageons a respecter le Reglement General sur la
              Protection des Donnees (RGPD) ainsi que la Loi federale suisse sur
              la protection des donnees (LPD).
            </p>
          </div>

          {/* Donnees collectees */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Donnees collectees
            </h2>
            <p className="mb-3">
              Nous collectons les categories de donnees suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium text-gray-900">
                  Donnees d&apos;inscription
                </span>{' '}
                : adresse e-mail, nom complet, photo de profil (via Clerk).
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Contenu du CV
                </span>{' '}
                : le fichier PDF que vous importez ainsi que les donnees
                extraites lors de l&apos;analyse (competences, experiences,
                formation).
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Donnees d&apos;utilisation
                </span>{' '}
                : pages consultees, actions effectuees, offres d&apos;emploi
                sauvegardees, preferences de recherche.
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Donnees techniques
                </span>{' '}
                : adresse IP, type de navigateur, systeme d&apos;exploitation
                (collectees automatiquement via les journaux serveur).
              </li>
            </ul>
          </div>

          {/* Finalites */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              2. Finalites du traitement
            </h2>
            <p className="mb-3">
              Vos donnees sont traitees pour les finalites suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Fournir le service d&apos;analyse de CV et de matching avec les
                offres d&apos;emploi.
              </li>
              <li>Gerer votre compte utilisateur et vos preferences.</li>
              <li>
                Ameliorer la qualite de nos services et developper de nouvelles
                fonctionnalites.
              </li>
              <li>
                Vous envoyer des notifications par e-mail (alertes emploi,
                digest hebdomadaire) si vous y avez consenti.
              </li>
              <li>
                Assurer la securite et le bon fonctionnement de la plateforme.
              </li>
            </ul>
          </div>

          {/* Sous-traitants */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. Sous-traitants et tiers
            </h2>
            <p className="mb-3">
              Nous faisons appel aux sous-traitants suivants pour le
              fonctionnement de notre service :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Prestataire
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Finalite
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Localisation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium">OpenAI</td>
                    <td className="px-4 py-3">
                      Analyse de CV par intelligence artificielle
                    </td>
                    <td className="px-4 py-3">Etats-Unis</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Clerk</td>
                    <td className="px-4 py-3">
                      Authentification et gestion des comptes
                    </td>
                    <td className="px-4 py-3">Etats-Unis</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Supabase</td>
                    <td className="px-4 py-3">
                      Base de donnees et stockage des fichiers CV
                    </td>
                    <td className="px-4 py-3">Union europeenne</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Stripe</td>
                    <td className="px-4 py-3">Traitement des paiements</td>
                    <td className="px-4 py-3">Etats-Unis / UE</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Vercel</td>
                    <td className="px-4 py-3">Hebergement de la plateforme</td>
                    <td className="px-4 py-3">Etats-Unis / UE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Pour les transferts vers les Etats-Unis, nous nous appuyons sur les
              Clauses Contractuelles Types (CCT) de la Commission europeenne.
            </p>
          </div>

          {/* Conservation */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              4. Duree de conservation
            </h2>
            <p>
              Vos donnees personnelles sont conservees aussi longtemps que votre
              compte existe. Lorsque vous supprimez votre compte, toutes vos
              donnees (CV, analyses, offres sauvegardees, preferences) sont
              definitivement supprimees de nos systemes dans un delai de 30
              jours.
            </p>
          </div>

          {/* Droits */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              5. Vos droits
            </h2>
            <p className="mb-3">
              Conformement au RGPD et a la LPD, vous disposez des droits
              suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium text-gray-900">
                  Droit d&apos;acces
                </span>{' '}
                : obtenir une copie de vos donnees personnelles.
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Droit de rectification
                </span>{' '}
                : corriger des donnees inexactes ou incompletes.
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Droit a l&apos;effacement
                </span>{' '}
                : supprimer votre compte et toutes vos donnees depuis la page{' '}
                <span className="font-medium">Parametres</span> de votre tableau
                de bord.
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Droit a la portabilite
                </span>{' '}
                : recevoir vos donnees dans un format structure et lisible par
                machine.
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Droit d&apos;opposition
                </span>{' '}
                : vous opposer au traitement de vos donnees a des fins de
                prospection commerciale.
              </li>
            </ul>
            <p className="mt-3">
              Pour exercer vos droits, contactez-nous a l&apos;adresse :{' '}
              <a
                href="mailto:privacy@kandid.app"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                privacy@kandid.app
              </a>
            </p>
          </div>

          {/* Cookies */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              6. Cookies
            </h2>
            <p className="mb-3">
              Nous utilisons des cookies strictement necessaires au
              fonctionnement du service (authentification, preferences de
              session). Nous pouvons egalement utiliser des cookies d&apos;analyse
              pour comprendre l&apos;utilisation de la plateforme.
            </p>
            <p>
              Vous pouvez accepter ou refuser les cookies non essentiels via la
              banniere de consentement affichee lors de votre premiere visite.
              Vous pouvez egalement configurer votre navigateur pour bloquer les
              cookies.
            </p>
          </div>

          {/* Securite */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              7. Securite
            </h2>
            <p>
              Nous mettons en oeuvre des mesures techniques et organisationnelles
              appropriees pour proteger vos donnees personnelles contre tout
              acces non autorise, perte ou alteration. Les communications sont
              chiffrees via HTTPS et les fichiers CV sont stockes de maniere
              securisee sur Supabase Storage.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              8. Contact
            </h2>
            <p>
              Pour toute question relative a la presente politique de
              confidentialite ou a la protection de vos donnees, vous pouvez nous
              contacter :
            </p>
            <ul className="mt-3 space-y-1">
              <li>
                E-mail :{' '}
                <a
                  href="mailto:privacy@kandid.app"
                  className="text-indigo-600 hover:text-indigo-500 underline"
                >
                  privacy@kandid.app
                </a>
              </li>
              <li>
                Site :{' '}
                <span className="font-medium text-gray-900">kandid.app</span>
              </li>
            </ul>
          </div>

          {/* Modifications */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              9. Modifications
            </h2>
            <p>
              Nous nous reservons le droit de modifier la presente politique de
              confidentialite a tout moment. En cas de modification substantielle,
              nous vous en informerons par e-mail ou via une notification sur la
              plateforme. La date de derniere mise a jour est indiquee en haut de
              cette page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
