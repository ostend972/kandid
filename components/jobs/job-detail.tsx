'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Building2,
  BarChart3,
  FileText,
  Send,
} from 'lucide-react';
import { ApplyWizard } from '@/components/application/apply-wizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { MatchBadge } from './match-badge';
import { MatchBreakdown } from './match-breakdown';
import { LegitimacyBadge } from './legitimacy-badge';
import { cn } from '@/lib/utils';
import { sourceLabel } from '@/lib/source-label';
import { formatJobDescription } from '@/lib/format-description';

export interface JobDetailData {
  id: string;
  title: string;
  company: string;
  canton: string;
  contractType: string | null;
  activityRate: string | null;
  publishedAt: string | null;
  sourceUrl: string;
  source?: string | null;
  matchScore: number | null;
  description?: string;
  salary?: string | null;
  legitimacyTier?: string | null;
  legitimacyScore?: number | null;
}

interface JobDetailProps {
  job: JobDetailData | null;
  isSaved: boolean;
  onToggleSave: () => void;
  hasCvAnalysis?: boolean;
  cvAnalysisId?: string | null;
  cvFileName?: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getMatchVerdict(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80)
    return { label: 'Correspondance excellente', color: 'text-emerald-700 dark:text-emerald-400' };
  if (score >= 40)
    return { label: 'Bon potentiel', color: 'text-amber-700 dark:text-amber-400' };
  return { label: 'A ameliorer', color: 'text-red-700 dark:text-red-400' };
}

function getProgressColor(score: number): string {
  if (score >= 80) return '[&>div[data-slot=progress-indicator]]:bg-emerald-500';
  if (score >= 40) return '[&>div[data-slot=progress-indicator]]:bg-amber-500';
  return '[&>div[data-slot=progress-indicator]]:bg-red-500';
}

import { sanitizeHtml } from '@/lib/sanitize';

export function JobDetail({
  job,
  isSaved,
  onToggleSave,
  hasCvAnalysis = false,
  cvAnalysisId = null,
  cvFileName = null,
}: JobDetailProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);

  // Reset breakdown state when switching jobs
  useEffect(() => {
    setShowBreakdown(false);
    setAiScore(null);
  }, [job?.id]);

  // Empty state
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground">
          Selectionnez une offre pour voir les details
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          Cliquez sur une offre dans la liste pour afficher ses details ici.
        </p>
      </div>
    );
  }

  const matchVerdict =
    job.matchScore !== null ? getMatchVerdict(job.matchScore) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-foreground leading-tight">
              {job.title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-base text-foreground font-medium">
                {job.company}
              </span>
            </div>
          </div>
          <MatchBadge score={aiScore ?? job.matchScore} className="text-sm shrink-0" />
        </div>

        {/* Meta tags */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {job.canton}
          </span>
          {job.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDate(job.publishedAt)}
            </span>
          )}
          {job.contractType && (
            <Badge
              variant="secondary"
              className="text-xs bg-muted text-foreground"
            >
              {job.contractType}
            </Badge>
          )}
          {job.activityRate && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {job.activityRate}
            </span>
          )}
          {job.salary && (
            <span className="text-foreground font-medium">{job.salary}</span>
          )}
          <LegitimacyBadge tier={job.legitimacyTier ?? null} score={job.legitimacyScore} />
        </div>
      </div>

      <Separator />

      {/* Match summary box — hidden when AI breakdown is shown */}
      {hasCvAnalysis && job.matchScore !== null && matchVerdict && (
        <>
          {showBreakdown && cvAnalysisId ? (
            /* AI Detailed Match Breakdown replaces the quick summary */
            <MatchBreakdown
              jobId={job.id}
              cvAnalysisId={cvAnalysisId}
              cvFileName={cvFileName || 'CV'}
              onScoreLoaded={(score) => setAiScore(score)}
            />
          ) : (
            /* Quick algorithmic match summary */
            <div className="rounded-lg border bg-muted p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BarChart3 className="h-4 w-4" />
                Compatibilite avec votre profil
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn('font-medium', matchVerdict.color)}>
                    {matchVerdict.label}
                  </span>
                  <span className="font-semibold text-foreground">
                    {job.matchScore}%
                  </span>
                </div>
                <Progress
                  value={job.matchScore}
                  className={cn('h-2.5', getProgressColor(job.matchScore))}
                />
              </div>
              {cvAnalysisId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:text-foreground p-0 h-auto font-medium"
                  onClick={() => setShowBreakdown(true)}
                >
                  Voir l'analyse detaillee
                </Button>
              )}
            </div>
          )}

          <Separator />
        </>
      )}

      {/* Job description */}
      {job.description && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Description du poste
          </h3>
          <div
            className="prose prose-sm prose-gray max-w-none break-words overflow-hidden
              [overflow-wrap:anywhere]
              [&_*]:max-w-full [&_*]:overflow-wrap-anywhere
              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
              [&_p]:text-sm [&_p]:text-foreground [&_p]:leading-relaxed [&_p]:my-1.5
              [&_br]:block [&_br]:content-[''] [&_br]:my-1
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
              [&_li]:text-sm [&_li]:text-foreground [&_li]:my-0.5
              [&_a]:text-foreground [&_a]:underline
              [&_strong]:font-semibold
              [&_table]:w-full [&_table]:text-sm
              [&_td]:p-1 [&_th]:p-1 [&_th]:text-left [&_th]:font-semibold
              [&_div]:max-w-full [&_span]:max-w-full
              [&_.C_PHTML]:text-sm [&_.C_PHTML]:leading-relaxed
              [&_.C_PBODYHTML]:text-sm [&_.C_PBODYHTML]:leading-relaxed
              [&_.C_PTITLEHTML]:text-base [&_.C_PTITLEHTML]:font-semibold [&_.C_PTITLEHTML]:my-2
              [&_.C_PHEADHTML]:text-sm [&_.C_PHEADHTML]:leading-relaxed [&_.C_PHEADHTML]:my-2
              [&_.C_PLOGOHTML]:hidden"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(formatJobDescription(job.description)),
            }}
          />
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {hasCvAnalysis && cvAnalysisId ? (
          <ApplyWizard
            jobId={job.id}
            jobTitle={job.title}
            jobCompany={job.company}
            cvAnalysisId={cvAnalysisId}
            jobSourceUrl={job.sourceUrl}
            trigger={
              <Button className="flex-1 sm:flex-none">
                <Send className="h-4 w-4 mr-2" />
                Postuler
              </Button>
            }
          />
        ) : (
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <a href="/dashboard/cv-analysis">
              <FileText className="h-4 w-4 mr-2" />
              Analysez d&apos;abord votre CV
            </a>
          </Button>
        )}

        <Button asChild variant="outline" size="sm">
          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir sur {sourceLabel(job.source)}
          </a>
        </Button>

        <Button
          variant="outline"
          onClick={onToggleSave}
          className={cn(
            isSaved && 'border-foreground text-foreground'
          )}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-4 w-4 mr-2 fill-current" />
              Sauvegardee
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>

      {/* Company info */}
      <div className="rounded-lg border p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">
          A propos de l'entreprise
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{job.company}</p>
            <p className="text-xs text-muted-foreground">{job.canton}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
