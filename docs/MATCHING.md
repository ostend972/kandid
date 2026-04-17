# Score de Matching Kandid

Comment Kandid calcule la compatibilité entre un CV et une offre d'emploi.

---

## Vue d'ensemble

Chaque offre d'emploi reçoit un **score de 0 à 100%** qui indique à quel point elle correspond au profil extrait du CV de l'utilisateur.

Ce score répond à une seule question : *"Cette offre vaut-elle la peine que le candidat y postule ?"*

Le score est calculé en temps réel au moment où l'utilisateur consulte la liste d'offres — il n'est pas stocké. Cela signifie que si l'utilisateur change de CV actif, les scores se recalculent automatiquement pour refléter le nouveau profil.

---

## Les 6 critères de matching

Le score final est une **moyenne pondérée** de six critères. Chacun est noté indépendamment de 0 à 100, puis pondéré selon son importance.

| Critère | Poids | Rôle |
|---|---|---|
| Compétences | 35% | Le cœur du match : est-ce que le candidat sait faire ce que le poste demande ? |
| Affinité métier | 25% | Le candidat a-t-il déjà occupé un poste similaire ? |
| Langues | 15% | Parle-t-il les langues requises au bon niveau ? |
| Séniorité | 10% | Son expérience correspond-elle au niveau du poste ? |
| Secteur | 10% | A-t-il travaillé dans le secteur d'activité visé ? |
| Taux d'activité | 5% | Le temps de travail proposé correspond-il à sa préférence ? |

**Note importante** : si un critère n'est pas évaluable (donnée manquante dans l'offre ou dans le CV), il est simplement **ignoré** et les autres critères sont repondérés pour toujours totaliser 100%. Le score reste ainsi juste même sur des offres incomplètes.

---

## 1. Compétences (35%)

Le critère le plus important. Kandid compare les compétences listées dans le CV avec celles demandées par l'offre.

**Trois niveaux de reconnaissance** :

- **Match exact** : la compétence est identique (ex : "Salesforce" dans le CV et "Salesforce" dans l'offre) → crédit maximal.
- **Match par famille** : la compétence fait partie d'une technologie apparentée (ex : "React" dans le CV et "Next.js" dans l'offre, ou "Salesforce" dans le CV et "CRM" dans l'offre) → crédit élevé (70%).
- **Match partiel par mots** : au moins la moitié des mots significatifs correspondent (ex : "Gestion de projet" et "Project management") → crédit proportionnel.

Lorsque l'offre ne liste pas explicitement ses compétences, Kandid cherche celles du CV dans la **description du poste** en texte libre. Chaque compétence retrouvée compte pour la note finale.

**Exemple concret** : un profil avec Salesforce, prospection commerciale, négociation qui postule à une offre listant "CRM, relation client, négociation" — les trois compétences sont reconnues (Salesforce ↔ CRM par famille, les autres par mots).

---

## 2. Affinité métier (25%)

Le critère qui empêche les faux positifs. Kandid compare le **titre de l'offre** aux **titres des postes occupés dans le CV** (actuel + anciens), en utilisant des **familles sémantiques**.

**Principe des familles** : au lieu de chercher des mots identiques, Kandid regroupe les mots-clés de métier dans des familles sémantiques. Par exemple, la famille `commercial` contient : commercial, vendeur, conseiller, consultant, account manager, sales, chargé de clientèle, attaché commercial, courtier, représentant, business developer, prospecteur, etc.

**Résultat** : un candidat qui a été "Conseiller commercial", "Attaché commercial BtoB" et "Chargé de clientèle" dans son CV fera un match fort avec :
- "Conseiller de vente" (même famille)
- "Account Manager" (même famille)
- "Key Account Manager" (même famille)
- "Supporter PME" (même famille si la description parle de commercial/PME)

Et un match faible avec :
- "Paysagiste" (famille `manual`)
- "Ingénieur d'exploitation" (famille `tech`)
- "Comptable fiduciaire" (famille `finance`)

**Bonus titre** : si le titre de l'offre appartient entièrement à une famille présente dans le CV, un bonus supplémentaire est ajouté — cela pousse en tête les offres dont le titre seul suffit à identifier le bon métier.

**Familles reconnues** : commercial, management, assistance, tech, finance, RH, juridique, marketing, manuel, santé, hôtellerie.

---

## 3. Langues (15%)

Kandid compare les langues du CV avec les langues exigées par l'offre, en respectant les **niveaux CEFR** (A1 à C2).

**Logique** :
- Si le CV a le niveau exigé ou plus → 100%.
- Si le niveau CV est juste en dessous (gap de 1) → 65%.
- Si le gap est de 2 niveaux → 30%.
- Si le gap est de 3+ → 0%.

Des crédits partiels sont attribués quand l'une des deux parties ne précise pas de niveau, pour éviter de pénaliser injustement des offres imprécises.

Kandid **normalise** aussi les noms de langues : "français", "francais", "french" et "fr" sont tous reconnus comme la même langue.

Si l'offre ne liste pas de langue structurée, Kandid scanne la description pour y détecter des mentions (ex : "allemand exigé", "anglais souhaité").

---

## 4. Séniorité (10%)

Kandid infère le niveau de séniorité attendu à partir du titre et de la description de l'offre (stagiaire, junior, confirmé, senior, lead, director), puis le compare aux années d'expérience du CV.

**Barème d'expérience** :
- 0-2 ans → niveau Junior
- 3-5 ans → niveau Confirmé
- 6-10 ans → niveau Senior
- 11-15 ans → niveau Lead
- 15+ ans → niveau Direction

**Logique de match** :
- Niveau identique → 100%.
- 1 cran d'écart → 75%.
- 2 crans → 40%.
- 3+ crans → 10%.

Un candidat avec 9 ans d'expérience (niveau Senior) qui postule à un poste "Senior" fait un match parfait. S'il postule à un poste "Junior", le score de séniorité chute fortement car c'est un mismatch en sur-qualification.

---

## 5. Secteur (10%)

Kandid compare les secteurs d'activité du CV (ex : banque, assurance, grande distribution) avec les catégories de l'offre et sa description.

**Niveaux de match** :
- Nom de secteur présent dans les catégories structurées → 100%.
- Nom de secteur trouvé dans la description → 80%.
- Mots partiels qui correspondent → crédit proportionnel.

Exemple : un CV avec "banque" et "assurance" aura un bon score secteur sur une offre "Conseiller en assurances" (catégorie Finance/Banque/Assurance).

---

## 6. Taux d'activité (5%)

Le moins déterminant des critères, mais utile en filtrage. Kandid compare le taux préféré de l'utilisateur (défini dans ses paramètres) avec le taux proposé par l'offre (80%, 100%, 60-80%, etc.).

**Logique** :
- Taux dans la plage acceptée → 100%.
- Écart de 10% → 80%.
- Écart de 20% → 50%.
- Écart de 30% → 25%.
- Au-delà → 0%.

Si l'utilisateur n'a pas défini de préférence, ce critère retourne toujours 100% (pas de pénalité).

---

## Le hard cap anti-bruit

Un mécanisme de sécurité empêche les offres **totalement hors-domaine** de remonter trop haut artificiellement.

**Règle** : si l'offre a des compétences structurées ET que moins de 20% d'entre elles correspondent au CV ET que l'affinité métier est également faible, le score final est **plafonné à 45%**.

Cela protège contre les faux positifs : une offre où la langue, le taux et la séniorité sont compatibles peut sinon totaliser 55-65% par défaut, même sans aucun lien de métier. Le hard cap force ce type d'offre à rester sous le seuil "correct" (50%).

---

## Niveau de confiance

Chaque score est accompagné d'un niveau de confiance, basé sur le **nombre de critères** qu'on a pu évaluer :

| Confiance | Critères évaluables |
|---|---|
| Élevée | 4 ou plus |
| Moyenne | 3 |
| Faible | 2 ou moins |

Un score de 85% avec confiance *élevée* est beaucoup plus fiable qu'un score de 85% calculé sur seulement 2 critères (par ex. une offre sans description et sans skills structurées).

---

## Tri et filtre côté utilisateur

### Tri par défaut : Meilleur matching

Quand un CV est actif, la liste d'offres est **triée du score le plus haut au plus bas**. Les meilleures opportunités apparaissent en tête. L'utilisateur peut basculer sur "Date (récent)" s'il préfère voir les offres les plus récemment publiées.

### Filtre par seuil minimum

Quatre seuils sont disponibles :
- **Tous les scores** (par défaut) : aucun filtre, tous les matchs sont affichés.
- **≥ 50% (correct)** : cache les offres peu compatibles.
- **≥ 70% (bon)** : ne garde que les bonnes correspondances.
- **≥ 85% (excellent)** : uniquement les matchs exceptionnels.

### Pagination scorée

Pour garantir que les meilleurs matchs remontent toujours en tête, Kandid analyse un **lot élargi d'offres récentes** (les 500 plus fraîches correspondant aux autres filtres actifs), les score toutes, puis pagine en mémoire.

Cela signifie que le top des 20 offres affichées sur la page 1 est **vraiment le top absolu** de la base analysable — pas les 20 plus récentes par date avec un tri local.

**Sans CV actif** : le système ne peut pas scorer. Il pagine alors simplement par date et le filtre de matching est désactivé. Un bandeau invite alors l'utilisateur à analyser son CV pour débloquer le matching.

---

## Exemple de lecture d'un score

Prenons le profil de Cyprien Dumas : 9 ans d'expérience commerciale, passé au Crédit Agricole, chez Europcar, LIDL, avec la certification AMF et les compétences Salesforce, prospection, négociation.

**Offre : "Supporter PME au service externe – Allianz Suisse" (Genève, 100%)** — Score final : **77%**

Décomposition typique :
- Compétences : les compétences du CV (prospection, relation client, CRM) se retrouvent dans la description du poste → environ 60-75%.
- Affinité métier : "Supporter" appartient à la famille `commercial`, comme les titres "Conseiller commercial" et "Attaché commercial BtoB" du CV → 100%.
- Langues : français natif, poste en français → 100%.
- Séniorité : 9 ans (Senior) pour un poste sans mention explicite → critère ignoré ou crédité selon la description.
- Secteur : assurance (Allianz) vs CV avec Crédit Agricole (banque/assurance) → 80-100%.
- Taux d'activité : 100% compatible → 100%.

**Offre : "Paysagiste H/F" (Genève)** — Score final : **47%**

Décomposition typique :
- Compétences : aucune compétence commune → 0%.
- Affinité métier : "Paysagiste" est dans la famille `manual`, absente du CV → 0%.
- Langues : français → 100%.
- Séniorité : non inférable → critère ignoré.
- Secteur : pas de correspondance → 0%.
- Taux d'activité : 100% → 100%.

Sans le hard cap, les critères passifs (langues + taux) suffiraient à gonfler le score. Avec le hard cap, l'offre reste plafonnée à 45-47% — signalant clairement qu'il s'agit d'un mauvais match.

---

## Résumé visuel

```
Score final = (Compétences × 35%)
            + (Affinité métier × 25%)
            + (Langues × 15%)
            + (Séniorité × 10%)
            + (Secteur × 10%)
            + (Taux activité × 5%)

Si compétences < 20% ET affinité < 25% → plafond à 45%
```

Le matching Kandid privilégie ce qui compte vraiment pour une candidature : **ce que le candidat sait faire** et **ce qu'il a déjà fait**, avant le reste.
