import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';
import { eq, desc, count, max, ilike, or, and, sql, SQL } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status') ?? 'all';

  // Stats (always unfiltered)
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

  // Build filters for jobs listing
  const conditions: SQL[] = [];

  if (status !== 'all') {
    conditions.push(eq(jobs.status, status));
  }

  if (search) {
    conditions.push(
      or(
        ilike(jobs.title, `%${search}%`),
        ilike(jobs.company, `%${search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Total count (filtered)
  const [totalResult] = await db
    .select({ value: count() })
    .from(jobs)
    .where(whereClause);

  const total = totalResult.value;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Paginated jobs
  const jobRows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      canton: jobs.canton,
      source: jobs.source,
      status: jobs.status,
      publishedAt: jobs.publishedAt,
      legitimacyTier: jobs.legitimacyTier,
    })
    .from(jobs)
    .where(whereClause)
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  // Legitimacy tier distribution
  const legitimacyDistribution = await db
    .select({ tier: jobs.legitimacyTier, count: count() })
    .from(jobs)
    .where(sql`${jobs.legitimacyTier} IS NOT NULL`)
    .groupBy(jobs.legitimacyTier);

  return NextResponse.json({
    activeCount: activeResult.value,
    expiredCount: expiredResult.value,
    lastScrape: lastScrapeResult.value,
    sourceDistribution: Object.fromEntries(
      sourceDistribution.map((r) => [r.source, r.count])
    ),
    legitimacyDistribution: Object.fromEntries(
      legitimacyDistribution.map((r) => [r.tier ?? 'unknown', r.count])
    ),
    jobs: {
      data: jobRows,
      total,
      page,
      totalPages,
    },
  });
}
