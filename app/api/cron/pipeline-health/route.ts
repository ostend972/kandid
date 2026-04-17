import { NextRequest, NextResponse } from 'next/server';
import { runFullHealthCheck } from '@/lib/pipeline-health';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const providedSecret = authHeader?.replace('Bearer ', '');
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await runFullHealthCheck();
    console.log(
      `[cron/pipeline-health] status=${report.summary.status} issues=${report.summary.totalIssues}`,
    );
    return NextResponse.json(report);
  } catch (err) {
    console.error('[cron/pipeline-health] Error:', err);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }
}
