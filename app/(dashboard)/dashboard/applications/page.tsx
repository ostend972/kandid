import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Building2, Calendar, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApplicationsByUserWithUrgency } from '@/lib/db/kandid-queries';
import { computeUrgency } from '@/lib/cadence';
import type { UrgencyLevel } from '@/lib/cadence';
import type { ApplicationStatus } from '@/lib/db/schema';
import { UrgencyBadge } from '@/components/applications/urgency-badge';
import { StatusBadge } from '@/components/applications/status-badge';

function daysSince(date: Date | string | null): number {
  if (!date) return 0;
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
}

const sectionOrder: UrgencyLevel[] = ['urgent', 'overdue', 'waiting', 'cold'];
const sectionLabels: Record<UrgencyLevel, string> = {
  urgent: 'Urgent',
  overdue: 'En retard',
  waiting: 'En attente',
  cold: 'Froid',
};

export default async function ApplicationsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const rows = await getApplicationsByUserWithUrgency(userId);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <ClipboardList className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Aucune candidature</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Vous n&apos;avez pas encore de candidature. Parcourez les offres d&apos;emploi pour commencer.
        </p>
        <Button asChild>
          <Link href="/dashboard/jobs">Parcourir les offres</Link>
        </Button>
      </div>
    );
  }

  type AppRow = (typeof rows)[number];
  const grouped: Record<UrgencyLevel, (AppRow & { urgency: UrgencyLevel })[]> = {
    urgent: [],
    overdue: [],
    waiting: [],
    cold: [],
  };

  for (const row of rows) {
    const app = row.application;
    const status = app.status as ApplicationStatus;
    const daysApp = daysSince(app.lastStatusChangedAt ?? app.createdAt);
    const urgency = computeUrgency(status, daysApp, null, app.followUpCount ?? 0);
    grouped[urgency].push({ ...row, urgency });
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Mes candidatures</h1>
      {sectionOrder.map((level) => {
        const items = grouped[level];
        if (items.length === 0) return null;
        return (
          <section key={level}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {sectionLabels[level]}
              <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
            </h2>
            <div className="grid gap-3">
              {items.map(({ application: app, job, urgency }) => (
                <Link key={app.id} href={`/dashboard/applications/${app.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="flex items-center gap-4 py-4 px-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {app.jobTitle || job?.title || 'Sans titre'}
                          </span>
                          <StatusBadge status={app.status as ApplicationStatus} />
                          <UrgencyBadge urgency={urgency} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {(app.jobCompany || job?.company) && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {app.jobCompany || job?.company}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {daysSince(app.lastStatusChangedAt ?? app.createdAt)}j
                          </span>
                          {app.nextFollowUpAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(app.nextFollowUpAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      {(app.status as ApplicationStatus) === 'interview' && (
                        <Link
                          href={`/dashboard/applications/${app.id}/interview-prep`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        >
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            Préparation interview
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
