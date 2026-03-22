import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, cvAnalyses, applications } from '@/lib/db/schema';
import { count, eq, ilike, or, desc, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const search = searchParams.get('search')?.trim() || '';

  // ---------------------------------------------------------------------------
  // Subqueries for aggregated counts
  // ---------------------------------------------------------------------------
  const analysesCountSq = db
    .select({
      userId: cvAnalyses.userId,
      count: count().as('analyses_count'),
    })
    .from(cvAnalyses)
    .groupBy(cvAnalyses.userId)
    .as('analyses_sq');

  const applicationsCountSq = db
    .select({
      userId: applications.userId,
      count: count().as('applications_count'),
    })
    .from(applications)
    .groupBy(applications.userId)
    .as('applications_sq');

  const lastCvScoreSq = db
    .select({
      userId: cvAnalyses.userId,
      lastScore:
        sql<number>`(SELECT ${cvAnalyses.overallScore} FROM cv_analyses AS ca WHERE ca.user_id = ${cvAnalyses.userId} ORDER BY ca.created_at DESC LIMIT 1)`.as(
          'last_score'
        ),
    })
    .from(cvAnalyses)
    .groupBy(cvAnalyses.userId)
    .as('last_cv_sq');

  // ---------------------------------------------------------------------------
  // Search filter
  // ---------------------------------------------------------------------------
  const searchFilter = search
    ? or(
        ilike(users.email, `%${search}%`),
        ilike(users.fullName, `%${search}%`)
      )
    : undefined;

  // ---------------------------------------------------------------------------
  // Total count (for pagination)
  // ---------------------------------------------------------------------------
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(users)
    .where(searchFilter);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ---------------------------------------------------------------------------
  // Users query with left-joined subqueries
  // ---------------------------------------------------------------------------
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      plan: users.plan,
      createdAt: users.createdAt,
      analysesCount: sql<number>`COALESCE(${analysesCountSq.count}, 0)`,
      applicationsCount: sql<number>`COALESCE(${applicationsCountSq.count}, 0)`,
      lastCvScore: lastCvScoreSq.lastScore,
    })
    .from(users)
    .leftJoin(analysesCountSq, eq(users.id, analysesCountSq.userId))
    .leftJoin(applicationsCountSq, eq(users.id, applicationsCountSq.userId))
    .leftJoin(lastCvScoreSq, eq(users.id, lastCvScoreSq.userId))
    .where(searchFilter)
    .orderBy(desc(users.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return NextResponse.json({
    users: rows,
    total,
    page,
    totalPages,
  });
}
