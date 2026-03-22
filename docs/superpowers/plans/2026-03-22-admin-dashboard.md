# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin dashboard at `/admin` with global stats, user management, and scraper controls — protected by Clerk admin role.

**Architecture:** Separate `/admin` route group with its own layout using shadcn Space sidebar-05 + dashboard-shell-01. Server Components for data fetching, Recharts for charts. Admin access via Clerk metadata `role: "admin"`. API routes protected by `requireAdmin()` helper.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM, Clerk 7 metadata, Recharts, shadcn Space blocks, Inter font

**Spec:** `docs/superpowers/specs/2026-03-22-admin-dashboard-design.md`

---

## Task 1: Install dependencies + shadcn Space blocks

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install sidebar-05 and dashboard-shell-01**

```bash
npx shadcn@latest add @shadcn-space/sidebar-05 --overwrite --yes
npx shadcn@latest add @shadcn-space/dashboard-shell-01 --overwrite --yes
```

- [ ] **Step 2: Verify installation**

Check that files exist:
- `components/shadcn-space/blocks/sidebar-05/`
- `components/shadcn-space/blocks/dashboard-shell-01/` (some files already exist from previous install)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: install sidebar-05 + dashboard-shell-01 blocks for admin dashboard"
```

---

## Task 2: Create requireAdmin helper + update middleware

**Files:**
- Create: `lib/auth/require-admin.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Create requireAdmin helper**

Create `lib/auth/require-admin.ts`:

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }
  const role = (sessionClaims?.metadata as Record<string, unknown>)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
  }
  return userId;
}
```

- [ ] **Step 2: Update middleware**

Read `middleware.ts`. Add `'/admin(.*)'` to the `isProtectedRoute` matcher. After `auth.protect()`, add an admin role check:

```typescript
if (request.nextUrl.pathname.startsWith('/admin')) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as Record<string, unknown>)?.role;
  if (role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

Note: Read the existing middleware carefully — it uses Clerk's `clerkMiddleware` pattern. Integrate the admin check within the existing flow, not as a separate middleware.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/require-admin.ts middleware.ts
git commit -m "feat: add requireAdmin helper + protect /admin routes in middleware"
```

---

## Task 3: Create admin layout with sidebar

**Files:**
- Create: `app/admin/layout.tsx`

- [ ] **Step 1: Read the installed sidebar-05 and dashboard-shell-01 files**

Understand their structure, imports, and props.

- [ ] **Step 2: Create admin layout**

Create `app/admin/layout.tsx` that:
- Uses the sidebar-05 component (or adapts dashboard-shell-01's AppSidebar)
- Has 4 nav items: Dashboard (/admin), Utilisateurs (/admin/users), Scraper (/admin/scraper), Retour au site (/dashboard)
- Uses Inter font
- Logo Kandid in sidebar header
- Replace the promo card with "Admin Kandid" badge
- Uses `usePathname()` for active nav state
- Includes Clerk UserButton in the header

Follow the same pattern as the existing dashboard layout at `app/(dashboard)/layout.tsx` but with admin-specific nav items.

- [ ] **Step 3: Commit**

```bash
git add app/admin/
git commit -m "feat: create admin layout with sidebar-05 navigation"
```

---

## Task 4: Create admin stats API route

**Files:**
- Create: `app/api/admin/stats/route.ts`

- [ ] **Step 1: Create the stats API route**

`GET /api/admin/stats` returns all KPI data in one call:

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/drizzle';
import { users, cvAnalyses, applications, jobs, jobMatches, savedJobs, candidateDocuments, aiGenerationsLog } from '@/lib/db/schema';
import { count, avg, eq, sql, gte, and } from 'drizzle-orm';

export async function GET() {
  const result = requireAdmin();
  if (result instanceof NextResponse) return result;

  // KPI counts
  const [usersCount] = await db.select({ total: count() }).from(users);
  const [analysesCount] = await db.select({ total: count() }).from(cvAnalyses);
  const [applicationsCount] = await db.select({ total: count() }).from(applications);
  const [activeJobsCount] = await db.select({ total: count() }).from(jobs).where(eq(jobs.status, 'active'));
  const [expiredJobsCount] = await db.select({ total: count() }).from(jobs).where(eq(jobs.status, 'expired'));
  const [matchesCount] = await db.select({ total: count() }).from(jobMatches);
  const [savedCount] = await db.select({ total: count() }).from(savedJobs);
  const [docsCount] = await db.select({ total: count() }).from(candidateDocuments);

  // Today's AI generations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [aiTodayCount] = await db.select({ total: count() }).from(aiGenerationsLog).where(gte(aiGenerationsLog.createdAt, today));

  // Averages
  const [avgCvScore] = await db.select({ avg: avg(cvAnalyses.overallScore) }).from(cvAnalyses);
  const [avgMatchScore] = await db.select({ avg: avg(jobMatches.overallScore) }).from(jobMatches);

  // Completion rate
  const [completedApps] = await db.select({ total: count() }).from(applications).where(eq(applications.status, 'completed'));

  // Signups per day (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const signupsByDay = await db.execute(sql`
    SELECT DATE(created_at) as day, COUNT(*) as count
    FROM users
    WHERE created_at IS NOT NULL AND created_at >= ${sevenDaysAgo}
    GROUP BY DATE(created_at)
    ORDER BY day
  `);

  // Jobs by canton (top 10)
  const jobsByCanton = await db.execute(sql`
    SELECT canton, COUNT(*) as count
    FROM jobs
    WHERE status = 'active'
    GROUP BY canton
    ORDER BY count DESC
    LIMIT 10
  `);

  return NextResponse.json({
    kpi: {
      users: usersCount?.total ?? 0,
      analyses: analysesCount?.total ?? 0,
      applications: applicationsCount?.total ?? 0,
      activeJobs: activeJobsCount?.total ?? 0,
      expiredJobs: expiredJobsCount?.total ?? 0,
      aiToday: aiTodayCount?.total ?? 0,
      matches: matchesCount?.total ?? 0,
      savedJobs: savedCount?.total ?? 0,
      documents: docsCount?.total ?? 0,
    },
    averages: {
      cvScore: Math.round(Number(avgCvScore?.avg ?? 0)),
      matchScore: Math.round(Number(avgMatchScore?.avg ?? 0)),
      completionRate: applicationsCount?.total ? Math.round((completedApps?.total ?? 0) / applicationsCount.total * 100) : 0,
    },
    charts: {
      signupsByDay,
      jobsByCanton,
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/
git commit -m "feat: add admin stats API route with KPI, averages, charts data"
```

---

## Task 5: Create admin users API routes

**Files:**
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Create users list route**

`GET /api/admin/users?page=1&search=` — returns paginated user list with stats:

Query joins users with counts of cv_analyses, applications. Supports search by email/fullName. Returns 20 per page.

- [ ] **Step 2: Create user detail route**

`GET /api/admin/users/[id]` — returns full user profile with their analyses, applications, and document count.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/users/
git commit -m "feat: add admin users API routes (list + detail)"
```

---

## Task 6: Create admin scraper API routes

**Files:**
- Create: `app/api/admin/scraper/stats/route.ts`
- Create: `app/api/admin/scraper/purge-preview/route.ts`
- Create: `app/api/admin/scraper/purge/route.ts`

- [ ] **Step 1: Create scraper stats route**

`GET /api/admin/scraper/stats` — returns active/expired counts, last seen date, source distribution.

- [ ] **Step 2: Create purge preview route**

`GET /api/admin/scraper/purge-preview` — returns count of expired jobs to be deleted + cascade impact (saved_jobs count, job_matches count for those jobs).

- [ ] **Step 3: Create purge route**

`POST /api/admin/scraper/purge` — deletes all jobs with status='expired'. CASCADE handles saved_jobs and job_matches. Returns count of deleted jobs.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/scraper/
git commit -m "feat: add admin scraper API routes (stats, purge-preview, purge)"
```

---

## Task 7: Create admin dashboard page (stats + charts)

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create the admin stats page**

Server Component that fetches stats from the API or directly from DB (Server Component can query DB directly — no need for API call).

Layout:
- Row 1: 7 KPI cards (Users, Analyses, Candidatures, Offres actives, Expirees, IA aujourd'hui, Matches)
- Row 2: 3 charts (Inscriptions bar chart, Score CV moyen number, Offres par canton pie chart)
- Row 3: 5 secondary stats (Score moyen, Match moyen, Taux completion, Saved jobs, Documents)

Use Recharts for charts. Use shadcn Card components for KPI cards.

Style: match the dashboard-shell-01 design. Use Inter font. Colors consistent with the dashboard.

- [ ] **Step 2: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin stats dashboard page with KPI cards and charts"
```

---

## Task 8: Create admin users page

**Files:**
- Create: `app/admin/users/page.tsx`

- [ ] **Step 1: Create users management page**

Client Component (needs interactivity for search, pagination, detail sheet).

Features:
- Header with title + search input
- Table with columns: Email, Nom, Inscription, Analyses, Candidatures, Score CV, Plan
- Pagination at bottom (20 per page)
- Click row → opens Sheet with user detail (analyses list, applications list, document count)
- Loading skeleton while fetching
- Uses SWR or fetch to call `/api/admin/users`

- [ ] **Step 2: Commit**

```bash
git add app/admin/users/
git commit -m "feat: add admin users management page with table, search, detail sheet"
```

---

## Task 9: Create admin scraper page

**Files:**
- Create: `app/admin/scraper/page.tsx`

- [ ] **Step 1: Create scraper management page**

Client Component with:
- 4 stat cards: Active jobs, Expired jobs, Last scrape date, Source distribution
- Table: 20 latest jobs (title, company, canton, source, date)
- Pagination
- "Purger les offres expirees" button:
  1. Click → fetch purge-preview → show count in dialog
  2. Confirm → POST purge → toast success with count
  3. Refresh stats

- [ ] **Step 2: Commit**

```bash
git add app/admin/scraper/
git commit -m "feat: add admin scraper page with stats, table, purge button"
```

---

## Task 10: Set admin role in Clerk + test

- [ ] **Step 1: Set your Clerk user as admin**

Go to Clerk dashboard → Users → Select your user → Metadata → Public metadata → Add:
```json
{ "role": "admin" }
```

Or via Clerk API:
```bash
curl -X PATCH "https://api.clerk.com/v1/users/user_3BDHZN3WVWfTqMLoqr4IZ7OFeYB" \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata": {"role": "admin"}}'
```

- [ ] **Step 2: Test access**

- Navigate to `http://localhost:3000/admin` — should load the admin dashboard
- Check KPI cards show correct numbers
- Check charts render
- Navigate to `/admin/users` — should show user table
- Navigate to `/admin/scraper` — should show job stats
- Test purge preview (don't actually purge in dev)

- [ ] **Step 3: Test non-admin access**

- Create or use another Clerk user without admin role
- Navigate to `/admin` — should redirect to `/dashboard`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete admin dashboard — stats, users, scraper management"
```
