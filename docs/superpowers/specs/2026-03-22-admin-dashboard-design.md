# Dashboard Admin Kandid — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Author:** Alan + Claude

## Overview

Dashboard d'administration pour Kandid. Route `/admin` separee du dashboard utilisateur. Permet de monitorer les stats globales, gerer les utilisateurs, et controler le scraper d'offres d'emploi.

## Acces et securite

- Route : `/admin` avec layout propre
- Protection : metadata Clerk `role: "admin"` — verifiee dans le middleware Next.js
- Utilisateurs non-admin redirigees vers `/dashboard`
- Pas de lien visible vers `/admin` dans le dashboard utilisateur

## Architecture technique

### Blocs shadcn Space
- **sidebar-05** — Admin Sidebar with Promo (nav admin)
- **dashboard-shell-01** — Analytics Dashboard Shell (layout KPI + charts + tables)

### Technologies
- Next.js 16 App Router (Server Components pour les stats)
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

**Charts :**
- Inscriptions par jour (7 derniers jours) — bar chart
- Score CV moyen — gauge ou nombre
- Repartition des offres par canton — pie chart

**Stats secondaires :**
- Score CV moyen global
- Taux de completion wizard (applications completed / total)
- Offres sauvegardees totales (count saved_jobs)
- Documents uploades (count candidate_documents)

### Page 2 — `/admin/users` (Gestion utilisateurs)

**Table utilisateurs :**
- Colonnes : Email, Nom, Date inscription, Nb analyses, Nb candidatures, Score dernier CV, Plan
- Recherche par email/nom
- Pagination (20 par page)
- Clic sur une ligne : voir le detail utilisateur

**Actions :**
- Voir le profil complet
- Pas de suppression (trop risque depuis l'admin)

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
- Bouton "Purger les offres expirees" (supprime les offres avec status='expired')

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
| `/api/admin/users/[id]` | GET | Detail utilisateur |
| `/api/admin/scraper/stats` | GET | Stats scraper |
| `/api/admin/scraper/purge` | POST | Purger offres expirees |

Toutes les routes admin verifient le role Clerk avant de repondre.

## Middleware

Ajouter dans le middleware Next.js existant :
```typescript
if (pathname.startsWith('/admin')) {
  // Verifier que l'utilisateur a le role admin dans Clerk metadata
  // Sinon redirect vers /dashboard
}
```

## File structure

```
app/
  admin/
    layout.tsx          (sidebar-05 + shell admin)
    page.tsx            (stats dashboard)
    users/
      page.tsx          (table utilisateurs)
    scraper/
      page.tsx          (stats + table scraper)
  api/
    admin/
      stats/route.ts
      users/route.ts
      users/[id]/route.ts
      scraper/
        stats/route.ts
        purge/route.ts
```

## Dependencies
- sidebar-05 de shadcn Space (a installer)
- dashboard-shell-01 de shadcn Space (deja installe)
- Recharts (deja installe)
