import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { jobs, savedJobs, jobMatches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { id } = await params;

  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { id } = await params;

  // CASCADE: delete saved_jobs and job_matches first (FK constraints)
  await db.delete(savedJobs).where(eq(savedJobs.jobId, id));
  await db.delete(jobMatches).where(eq(jobMatches.jobId, id));
  await db.delete(jobs).where(eq(jobs.id, id));

  return NextResponse.json({ success: true });
}
