import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { runFullHealthCheck } from '@/lib/pipeline-health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const report = await runFullHealthCheck();
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal error', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 },
    );
  }
}
