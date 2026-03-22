import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';
import { eq, desc, count, max } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const [activeResult] = await db
    .select({ value: count() })
    .from(jobs)
    .where(eq(jobs.status, 'active'));

  const [expiredResult] = await db
    .select({ value: count() })
    .from(jobs)
    .where(eq(jobs.status, 'expired'));

  const [lastScrapeResult] = await db
    .select({ value: max(jobs.lastSeenAt) })
    .from(jobs);

  const sourceDistribution = await db
    .select({ source: jobs.source, count: count() })
    .from(jobs)
    .groupBy(jobs.source);

  const recentJobs = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      canton: jobs.canton,
      source: jobs.source,
      publishedAt: jobs.publishedAt,
    })
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(20);

  return NextResponse.json({
    activeCount: activeResult.value,
    expiredCount: expiredResult.value,
    lastScrape: lastScrapeResult.value,
    sourceDistribution: Object.fromEntries(
      sourceDistribution.map((r) => [r.source, r.count])
    ),
    recentJobs,
  });
}
