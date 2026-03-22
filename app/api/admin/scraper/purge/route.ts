import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST() {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const result = await db
    .delete(jobs)
    .where(eq(jobs.status, 'expired'))
    .returning({ id: jobs.id });

  return NextResponse.json({ deletedCount: result.length });
}
