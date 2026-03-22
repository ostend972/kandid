# Dashboard Admin Kandid — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Author:** Alan + Claude

## Overview

Dashboard d'administration pour Kandid. Route `/admin` separee du dashboard utilisateur. Permet de monitorer les stats globales, gerer les utilisateurs, et controler le scraper d'offres d'emploi.

## Acces et securite

- Route : `/admin` avec layout propre
- Protection en 2 etapes dans le middleware Next.js :
  1. Ajouter `"/admin(.*)"` au matcher `isProtectedRoute` pour bloquer les non-authentifies
  2. Apres `auth.protect()`, verifier `sessionClaims.metadata.role === 'admin'` et rediriger les non-admins vers `/dashboard`
- Pas de lien visible vers `/admin` dans le dashboard utilisateur

### Helper API admin

Creer un helper reutilisable `lib/auth/require-admin.ts` :
```typescript
import { auth } from '@clerk/nextjs/server';

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error('Non authentifie');
  if ((sessionClaims?.metadata as any)?.role !== 'admin') {
    throw new Error('Acces refuse');
  }
  return userId;
}
```
Toutes les API routes admin utilisent ce helper.

## Architecture technique

### Blocs shadcn Space
- **sidebar-05** — Admin Sidebar with Promo (nav admin) — a installer via `npx shadcn@latest add @shadcn-space/sidebar-05`
- **dashboard-shell-01** — Analytics Dashboard Shell (layout KPI + charts + tables) — a installer via `npx shadcn@latest add @shadcn-space/dashboard-shell-01`

### Technologies
- Next.js 15 App Router (Server Components pour les stats)
- Drizzle ORM pour les requetes agregees
- Clerk metadata pour le role admin
- Recharts (deja installe) pour les graphiques
- Font Inter (coherent avec le reste)

## Pages

### Page 1 — `/admin` (Dashboard Stats)

**KPI Cards (ligne du haut) :**
- Utilisateurs totaux (count users)
- Analyses CV totales (count cv_analyses)
- Candidatures totales (count applications)
- Offres actives (count jobs WHERE status='active')
- Offres expirees (count jobs WHERE status='expired')
- Generations IA aujourd'hui (count ai_generations_log WHERE today)
- Matches IA totaux (count job_matches)

**Charts :**
- Inscriptions par jour (7 derniers jours) — bar chart (WHERE created_at IS NOT NULL)
- Score CV moyen — gauge ou nombre
- Repartition des offres par canton — pie chart

**Stats secondaires :**
- Score CV moyen global
- Score matching moyen (avg job_matches.overallScore)
- Taux de completion wizard : applications avec status='completed' / total applications
- Offres sauvegardees totales (count saved_jobs)
- Documents uploades (count candidate_documents)

**Etats de la page :**
- Loading : skeleton cards + skeleton charts
- Erreur : toast avec message
- Vide : afficher "0" dans les KPI (pas d'etat vide special)

### Page 2 — `/admin/users` (Gestion utilisateurs)

**Table utilisateurs :**
- Colonnes : Email, Nom, Date inscription, Nb analyses, Nb candidatures, Score dernier CV, Plan
- Recherche par email/nom
- Pagination (20 par page)
- Clic sur une ligne : ouvre un Sheet/Dialog avec le detail utilisateur (pas de page separee)

**Detail utilisateur (Sheet) :**
- Infos profil (nom, email, date inscription)
- Liste des analyses CV avec scores
- Liste des candidatures avec statuts
- Nombre de documents uploades

**Etats :**
- Loading : skeleton table
- Vide : "Aucun utilisateur" (improbable)
- Erreur : toast

### Page 3 — `/admin/scraper` (Gestion scraper)

**Stats scraper :**
- Total offres actives
- Total offres expirees
- Derniere execution du scraper (last job.lastSeenAt)
- Repartition par source (JobUp / Jobs.ch)

**Table :**
- 20 dernieres offres ajoutees (titre, entreprise, canton, source, date)
- Pagination

**Actions :**
- Bouton "Purger les offres expirees" :
  1. D'abord appelle `GET /api/admin/scraper/purge-preview` qui retourne le nombre d'offres a supprimer
  2. Affiche un dialog de confirmation : "X offres expirees seront supprimees. Les offres sauvegardees et les matches associes seront aussi supprimes (CASCADE). Continuer ?"
  3. Si confirme, appelle `POST /api/admin/scraper/purge`

**Etats :**
- Loading : skeleton
- Vide : "Aucune offre"
- Erreur : toast

## Navigation sidebar-05

```
ADMIN
- Dashboard (stats) → /admin
- Utilisateurs → /admin/users
- Scraper → /admin/scraper

---
Retour au site → /dashboard
```

Logo Kandid en haut de la sidebar.

## API Routes admin

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/stats` | GET | Stats globales (KPI + charts data) |
| `/api/admin/users` | GET | Liste utilisateurs paginee |
| `/api/admin/users/[id]` | GET | Detail utilisateur (analyses, candidatures, docs) |
| `/api/admin/scraper/stats` | GET | Stats scraper |
| `/api/admin/scraper/purge-preview` | GET | Nombre d'offres a purger (dry-run) |
| `/api/admin/scraper/purge` | POST | Purger offres expirees (avec CASCADE) |

Toutes les routes admin utilisent le helper `requireAdmin()` en premiere ligne.

## Middleware

Modifier `middleware.ts` :

```typescript
// Ajouter /admin aux routes protegees
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',  // AJOUTER
]);

// Apres auth.protect(), verifier le role admin
if (pathname.startsWith('/admin')) {
  const { sessionClaims } = await auth();
  if ((sessionClaims?.metadata as any)?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

## File structure

```
lib/
  auth/
    require-admin.ts       (helper requireAdmin)

app/
  admin/
    layout.tsx             (sidebar-05 + shell admin + Inter font)
    page.tsx               (stats dashboard — KPI + charts)
    users/
      page.tsx             (table utilisateurs + detail Sheet)
    scraper/
      page.tsx             (stats + table + purge)
  api/
    admin/
      stats/route.ts
      users/route.ts
      users/[id]/route.ts
      scraper/
        stats/route.ts
        purge-preview/route.ts
        purge/route.ts
```

## Dependencies
- sidebar-05 de shadcn Space (a installer)
- dashboard-shell-01 de shadcn Space (a installer)
- Recharts (deja installe)
