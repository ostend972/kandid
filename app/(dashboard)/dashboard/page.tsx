import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getUserStats,
  getCvAnalysesByUserId,
} from '@/lib/db/kandid-queries';
import { ensureCurrentUser } from '@/lib/auth/ensure-user';
import { HeroCta } from '@/components/dashboard/hero-cta';
import { ProgressionBlock } from '@/components/dashboard/progression-block';
import { FrontalierContext } from '@/components/dashboard/frontalier-context';
import { TopMatchesStrip } from '@/components/dashboard/top-matches-strip';
import { ActiveCvSelector } from '@/components/dashboard/active-cv-selector';

export const dynamic = 'force-dynamic';

function ProgressionSkeleton() {
  return (
    <section className="rounded-3xl border border-border bg-background p-6 sm:p-8">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-14 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-8 space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-[3px] w-full animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await ensureCurrentUser(userId);
  const [stats, analyses] = await Promise.all([
    getUserStats(userId),
    getCvAnalysesByUserId(userId),
  ]);

  const firstName = user?.fullName?.split(' ')[0] ?? 'candidat';
  const hasActiveCv = Boolean(user?.activeCvAnalysisId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <HeroCta firstName={firstName} hasActiveCv={hasActiveCv} />

      <Suspense fallback={<ProgressionSkeleton />}>
        <ProgressionBlock userId={userId} />
      </Suspense>

      {hasActiveCv ? (
        <Suspense fallback={null}>
          <TopMatchesStrip userId={userId} activeCvId={user!.activeCvAnalysisId} />
        </Suspense>
      ) : null}

      <Suspense fallback={null}>
        <FrontalierContext userId={userId} />
      </Suspense>

      {analyses.length > 1 ? (
        <section className="rounded-3xl border border-border bg-background p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                CV actif
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.totalAnalyses} analyse{stats.totalAnalyses > 1 ? 's' : ''} enregistrée
                {stats.totalAnalyses > 1 ? 's' : ''}
              </p>
            </div>
            <ActiveCvSelector
              analyses={analyses.map((a) => ({
                id: a.id,
                fileName: a.fileName,
                overallScore: a.overallScore,
                createdAt: a.createdAt,
              }))}
              activeCvId={user?.activeCvAnalysisId ?? null}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
