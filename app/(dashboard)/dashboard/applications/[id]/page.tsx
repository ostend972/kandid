import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  BookOpen,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CopyableTextCard } from '@/components/applications/copyable-text-card';
import { StatusBadge } from '@/components/applications/status-badge';
import { UrgencyBadge } from '@/components/applications/urgency-badge';
import { computeUrgency } from '@/lib/cadence';
import { getApplicationWithContext, getApplicationTransitions } from '@/lib/db/kandid-queries';
import { Timeline } from '@/components/applications/timeline';
import { NotesEditor } from '@/components/applications/notes-editor';
import type { ApplicationStatus } from '@/lib/db/schema';

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function daysSince(date: Date | string | null): number {
  if (!date) return 0;
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;
  const [data, transitions] = await Promise.all([
    getApplicationWithContext(id, userId),
    getApplicationTransitions(id, userId),
  ]);
  if (!data) notFound();

  const { application: app, job, cachedMatch } = data;
  const status = app.status as ApplicationStatus;
  const daysApp = daysSince(app.lastStatusChangedAt ?? app.createdAt);
  const urgency = computeUrgency(status, daysApp, null, app.followUpCount ?? 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux candidatures
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">
            {app.jobTitle || job?.title || 'Sans titre'}
          </h1>
          <StatusBadge status={status} />
          <UrgencyBadge urgency={urgency} />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {(app.jobCompany || job?.company) && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {app.jobCompany || job?.company}
            </span>
          )}
          {job?.canton && (
            <span className="flex items-center gap-1.5">
              {job.canton}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Créée le {formatDate(app.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {daysApp}j depuis dernière action
          </span>
        </div>
      </div>

      <Separator />

      {/* Match score */}
      {cachedMatch && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Score de compatibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-indigo-600">
                {cachedMatch.overallScore}%
              </span>
              <span className="text-sm text-muted-foreground">
                {cachedMatch.overallScore >= 80
                  ? 'Excellente correspondance'
                  : cachedMatch.overallScore >= 40
                    ? 'Bon potentiel'
                    : 'À améliorer'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents & actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cover letter */}
        {app.coverLetterText && (
          <CopyableTextCard
            title="Lettre de motivation"
            icon={<FileText className="h-4 w-4" />}
            text={app.coverLetterText}
          />
        )}

        {/* Email */}
        {app.emailBody && (
          <CopyableTextCard
            title="Email de candidature"
            icon={<Mail className="h-4 w-4" />}
            subtitle={app.emailSubject ?? undefined}
            text={app.emailBody}
          />
        )}

        {/* Generated CV */}
        {app.generatedCvUrl && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CV adapté
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/applications/${app.id}/download?mode=cv`}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dossier */}
        {app.dossierUrl && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dossier complet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/applications/${app.id}/download?mode=pdf`}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le dossier
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Follow-up info */}
      {app.nextFollowUpAt && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Prochain suivi</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(app.nextFollowUpAt)}
                  {app.followUpCount > 0 && ` · ${app.followUpCount} relance(s) envoyée(s)`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <NotesEditor
            applicationId={app.id}
            initialNotes={app.notes ?? ''}
          />
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline transitions={transitions ?? []} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {status === 'interview' && (
          <Button asChild>
            <Link href={`/dashboard/applications/${app.id}/interview-prep`}>
              <BookOpen className="h-4 w-4 mr-2" />
              Préparation entretien
            </Link>
          </Button>
        )}

        {job?.sourceUrl && (
          <Button asChild variant="outline">
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir l&apos;offre originale
            </a>
          </Button>
        )}
      </div>

      {/* Job description */}
      {(app.jobDescription || job?.description) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Description du poste</h2>
            <div
              className="prose prose-sm prose-gray max-w-none break-words overflow-hidden
                [overflow-wrap:anywhere]
                [&_*]:max-w-full
                [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
                [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2
                [&_p]:text-sm [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:my-1.5
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                [&_li]:text-sm [&_li]:text-gray-700 [&_li]:my-0.5
                [&_a]:text-indigo-600 [&_a]:underline
                [&_strong]:font-semibold
                [&_img]:hidden"
              dangerouslySetInnerHTML={{
                __html: (app.jobDescription || job?.description || ''),
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
