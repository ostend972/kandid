import { NextRequest, NextResponse } from 'next/server';
import { getApplicationsNeedingFollowUp, updateLastReminderSentAt } from '@/lib/db/kandid-queries';
import { computeUrgency, type UrgencyLevel } from '@/lib/cadence';
import { sendFollowUpReminderEmail, type FollowUpApplication } from '@/lib/email/resend';

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

  const errors: { applicationId: string; error: string }[] = [];
  let processed = 0;
  let sent = 0;
  let skipped = 0;

  try {
    const rows = await getApplicationsNeedingFollowUp();
    processed = rows.length;

    const byUser = new Map<string, typeof rows>();
    for (const row of rows) {
      const uid = row.userId;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)!.push(row);
    }

    for (const [userId, userRows] of byUser) {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const eligible = userRows.filter((r) => {
        const lastSent = r.application.lastReminderSentAt;
        return !lastSent || lastSent < oneDayAgo;
      });

      if (eligible.length === 0) {
        skipped += userRows.length;
        continue;
      }

      const followUpApps: FollowUpApplication[] = eligible.map((r) => {
        const app = r.application;
        const lastAction = app.lastStatusChangedAt ?? app.createdAt;
        const daysSinceLastAction = Math.floor(
          (now.getTime() - new Date(lastAction).getTime()) / (1000 * 60 * 60 * 24)
        );

        const urgency: UrgencyLevel = computeUrgency(
          app.status as Parameters<typeof computeUrgency>[0],
          daysSinceLastAction,
          null,
          app.followUpCount ?? 0
        );

        return {
          jobTitle: app.jobTitle ?? 'Sans titre',
          jobCompany: app.jobCompany ?? 'Entreprise inconnue',
          urgency,
          daysSinceLastAction,
          nextFollowUpDate: app.nextFollowUpAt
            ? new Date(app.nextFollowUpAt).toLocaleDateString('fr-CH')
            : '-',
        };
      });

      const userEmail = eligible[0].userEmail;
      const firstName = eligible[0].userFullName?.split(' ')[0] ?? '';

      try {
        await sendFollowUpReminderEmail(userEmail, firstName, followUpApps);
        const appIds = eligible.map((r) => r.application.id);
        await updateLastReminderSentAt(appIds);
        sent += eligible.length;
        console.log(
          `[cron/follow-up] Sent reminder for userId=${userId}, applicationIds=[${eligible.map((r) => r.application.id).join(',')}]`
        );
      } catch (err) {
        for (const r of eligible) {
          errors.push({
            applicationId: r.application.id,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      skipped += userRows.length - eligible.length;
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal error', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    );
  }

  console.log(`[cron/follow-up] processed=${processed} sent=${sent} skipped=${skipped} errors=${errors.length}`);

  return NextResponse.json({ processed, sent, skipped, errors });
}
