import { NextRequest, NextResponse } from 'next/server';
import { getSavedSearchesWithAlerts, searchJobs, updateSavedSearchAlertState } from '@/lib/db/kandid-queries';
import { sendSearchAlertEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const providedSecret = authHeader?.replace('Bearer ', '') || querySecret;
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let processed = 0;
  let alerted = 0;
  const errors: { searchId: string; error: string }[] = [];

  try {
    const searches = await getSavedSearchesWithAlerts();
    processed = searches.length;

    for (const search of searches) {
      try {
        const filters = search.filters as Record<string, unknown>;

        const sinceDate = search.lastAlertAt ?? new Date(search.createdAt.getTime() - 24 * 60 * 60 * 1000);
        const hoursSince = (Date.now() - sinceDate.getTime()) / (1000 * 60 * 60);

        let publishedSince: string;
        if (hoursSince <= 48) {
          publishedSince = '24h';
        } else if (hoursSince <= 168) {
          publishedSince = '7d';
        } else {
          publishedSince = '30d';
        }

        const result = await searchJobs({
          ...filters,
          publishedSince,
          page: 1,
          limit: 20,
        });

        if (result.jobs.length === 0) continue;

        const firstName = search.userFullName?.split(' ')[0] ?? '';
        const newJobs = result.jobs.map((job) => ({
          title: job.title,
          company: job.company ?? 'Entreprise inconnue',
          canton: job.canton ?? 'Suisse',
          url: `/dashboard/jobs/${job.id}`,
        }));

        await sendSearchAlertEmail({
          to: search.userEmail,
          firstName,
          searchName: search.name,
          newJobs,
        });

        await updateSavedSearchAlertState(search.id, result.jobs.length);
        alerted++;

        console.log(
          `[cron/search-alerts] Alert sent for searchId=${search.id}, userId=${search.userId}, jobs=${result.jobs.length}`
        );
      } catch (err) {
        errors.push({
          searchId: search.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        console.error(`[cron/search-alerts] Error processing searchId=${search.id}:`, err);
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal error', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    );
  }

  console.log(`[cron/search-alerts] processed=${processed} alerted=${alerted} errors=${errors.length}`);

  return NextResponse.json({ processed, alerted, errors });
}
