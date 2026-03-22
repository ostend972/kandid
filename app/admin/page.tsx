import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import {
  users,
  cvAnalyses,
  applications,
  jobs,
  aiGenerationsLog,
  jobMatches,
  savedJobs,
  candidateDocuments,
} from '@/lib/db/schema';
import { count, avg, eq, gte, desc, sql } from 'drizzle-orm';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  FileSearch,
  FileText,
  Briefcase,
  XCircle,
  Sparkles,
  BarChart3,
  BookmarkCheck,
  Upload,
  Target,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { SignupsChart, CantonChart } from './admin-charts';

/* -------------------------------------------------------------------------- */
/*  Auth guard                                                                */
/* -------------------------------------------------------------------------- */

async function assertAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');
  const metadata = sessionClaims?.metadata as
    | Record<string, unknown>
    | undefined;
  if (metadata?.role !== 'admin') redirect('/dashboard');
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default async function AdminDashboardPage() {
  await assertAdmin();

  // ---------------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // include today = 7 days

  // ---------------------------------------------------------------------------
  // KPI counts
  // ---------------------------------------------------------------------------
  const [
    [{ value: usersCount }],
    [{ value: cvAnalysesCount }],
    [{ value: applicationsCount }],
    [{ value: activeJobsCount }],
    [{ value: expiredJobsCount }],
    [{ value: aiGenerationsTodayCount }],
    [{ value: jobMatchesCount }],
    [{ value: savedJobsCount }],
    [{ value: candidateDocumentsCount }],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(cvAnalyses),
    db.select({ value: count() }).from(applications),
    db.select({ value: count() }).from(jobs).where(eq(jobs.status, 'active')),
    db.select({ value: count() }).from(jobs).where(eq(jobs.status, 'expired')),
    db
      .select({ value: count() })
      .from(aiGenerationsLog)
      .where(gte(aiGenerationsLog.createdAt, today)),
    db.select({ value: count() }).from(jobMatches),
    db.select({ value: count() }).from(savedJobs),
    db.select({ value: count() }).from(candidateDocuments),
  ]);

  // ---------------------------------------------------------------------------
  // Averages
  // ---------------------------------------------------------------------------
  const [
    [{ value: avgCvScore }],
    [{ value: avgMatchScore }],
    [{ value: completedApplicationsCount }],
  ] = await Promise.all([
    db.select({ value: avg(cvAnalyses.overallScore) }).from(cvAnalyses),
    db.select({ value: avg(jobMatches.overallScore) }).from(jobMatches),
    db
      .select({ value: count() })
      .from(applications)
      .where(eq(applications.status, 'completed')),
  ]);

  const completionRate =
    applicationsCount > 0
      ? Math.round((completedApplicationsCount / applicationsCount) * 100)
      : 0;

  // ---------------------------------------------------------------------------
  // Charts
  // ---------------------------------------------------------------------------
  const signupsPerDayRaw = await db
    .select({
      date: sql<string>`DATE(${users.createdAt})`.as('date'),
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);

  // Fill missing days so the chart always shows 7 bars
  const signupsMap = new Map(
    signupsPerDayRaw.map((r) => [r.date, r.count])
  );
  const signupsData: { day: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('fr-CH', {
      weekday: 'short',
      day: 'numeric',
    });
    signupsData.push({ day: label, count: signupsMap.get(key) ?? 0 });
  }

  const jobsByCantonRaw = await db
    .select({
      canton: jobs.canton,
      count: count(),
    })
    .from(jobs)
    .where(eq(jobs.status, 'active'))
    .groupBy(jobs.canton)
    .orderBy(desc(count()))
    .limit(10);

  const cantonData = jobsByCantonRaw.map((r) => ({
    canton: r.canton,
    count: r.count,
  }));

  // ---------------------------------------------------------------------------
  // KPI definitions
  // ---------------------------------------------------------------------------
  const kpiCards = [
    { label: 'Utilisateurs', value: usersCount, icon: Users },
    { label: 'Analyses CV', value: cvAnalysesCount, icon: FileSearch },
    { label: 'Candidatures', value: applicationsCount, icon: FileText },
    { label: 'Offres actives', value: activeJobsCount, icon: Briefcase },
    { label: 'Offres expirees', value: expiredJobsCount, icon: XCircle },
    {
      label: "IA aujourd'hui",
      value: aiGenerationsTodayCount,
      icon: Sparkles,
    },
    { label: 'Matches IA', value: jobMatchesCount, icon: BarChart3 },
  ];

  const secondaryCards = [
    {
      label: 'Score CV moyen',
      value: avgCvScore ? `${Math.round(Number(avgCvScore))}%` : '—',
      icon: Target,
    },
    {
      label: 'Score matching moyen',
      value: avgMatchScore ? `${Math.round(Number(avgMatchScore))}%` : '—',
      icon: TrendingUp,
    },
    {
      label: 'Taux de completion',
      value: `${completionRate}%`,
      icon: CheckCircle2,
    },
    {
      label: 'Offres sauvegardees',
      value: savedJobsCount,
      icon: BookmarkCheck,
    },
    {
      label: 'Documents uploades',
      value: candidateDocumentsCount,
      icon: Upload,
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">
        Tableau de bord admin
      </h1>

      {/* Row 1 — Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-3xl font-bold">
                    {kpi.value.toLocaleString('fr-CH')}
                  </p>
                </div>
                <kpi.icon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SignupsChart data={signupsData} />
        <CantonChart data={cantonData} />
      </div>

      {/* Row 3 — Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {secondaryCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">
                    {typeof stat.value === 'number'
                      ? stat.value.toLocaleString('fr-CH')
                      : stat.value}
                  </p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
