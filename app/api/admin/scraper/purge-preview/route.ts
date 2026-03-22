import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { jobs, savedJobs, jobMatches } from '@/lib/db/schema';
import { eq, count, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const [expiredResult] = await db
    .select({ value: count() })
    .from(jobs)
    .where(eq(jobs.status, 'expired'));

  const [savedResult] = await db
    .select({ value: count() })
    .from(savedJobs)
    .where(
      sql`${savedJobs.jobId} IN (SELECT ${jobs.id} FROM ${jobs} WHERE ${jobs.status} = 'expired')`
    );

  const [matchesResult] = await db
    .select({ value: count() })
    .from(jobMatches)
    .where(
      sql`${jobMatches.jobId} IN (SELECT ${jobs.id} FROM ${jobs} WHERE ${jobs.status} = 'expired')`
    );

  return NextResponse.json({
    expiredJobsCount: expiredResult.value,
    affectedSavedJobs: savedResult.value,
    affectedMatches: matchesResult.value,
  });
}
