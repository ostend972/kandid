'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { MatchBadge } from './match-badge';
import { MatchBreakdown } from './match-breakdown';
import { cn } from '@/lib/utils';

export interface JobDetailData {
  id: string;
  title: string;
  company: string;
  canton: string;
  contractType: string | null;
  activityRate: string | null;
  publishedAt: string | null;
  sourceUrl: string;
  matchScore: number | null;
  description?: string;
  salary?: string | null;
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
    return { label: 'Correspondance excellente', color: 'text-emerald-700' };
  if (score >= 40)
    return { label: 'Bon potentiel', color: 'text-amber-700' };
  return { label: 'A ameliorer', color: 'text-red-700' };
}

function getProgressColor(score: number): string {
  if (score >= 80) return '[&>div[data-slot=progress-indicator]]:bg-emerald-500';
  if (score >= 40) return '[&>div[data-slot=progress-indicator]]:bg-amber-500';
  return '[&>div[data-slot=progress-indicator]]:bg-red-500';
}

/**
 * Sanitize HTML by stripping script tags and event handlers,
 * keeping basic formatting (p, br, strong, em, ul, li, h1-h6, a, span, div, table, tr, td, th).
 */
function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handler attributes
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Remove javascript: urls
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  return clean;
}

export function JobDetail({
  job,
  isSaved,
  onToggleSave,
  hasCvAnalysis = false,
  cvAnalysisId = null,
  cvFileName = null,
}: JobDetailProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  // Empty state
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-500">
          Selectionnez une offre pour voir les details
        </h3>
        <p className="text-sm text-gray-400 mt-2 max-w-xs">
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
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {job.title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-gray-100">
                <Building2 className="h-4 w-4 text-gray-500" />
              </div>
              <span className="text-base text-gray-700 font-medium">
                {job.company}
              </span>
            </div>
          </div>
          <MatchBadge score={job.matchScore} className="text-sm shrink-0" />
        </div>

        {/* Meta tags */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-gray-400" />
            {job.canton}
          </span>
          {job.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              {formatDate(job.publishedAt)}
            </span>
          )}
          {job.contractType && (
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                job.contractType === 'CDI'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-amber-50 text-amber-700'
              )}
            >
              {job.contractType}
            </Badge>
          )}
          {job.activityRate && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              {job.activityRate}
            </span>
          )}
          {job.salary && (
            <span className="text-gray-700 font-medium">{job.salary}</span>
          )}
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
            />
          ) : (
            /* Quick algorithmic match summary */
            <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <BarChart3 className="h-4 w-4" />
                Compatibilite avec votre profil
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn('font-medium', matchVerdict.color)}>
                    {matchVerdict.label}
                  </span>
                  <span className="font-semibold text-gray-900">
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
                  className="text-indigo-600 hover:text-indigo-700 p-0 h-auto font-medium"
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
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Description du poste
          </h3>
          <div
            className="prose prose-sm prose-gray max-w-none
              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
              [&_p]:text-sm [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:my-1.5
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
              [&_li]:text-sm [&_li]:text-gray-700 [&_li]:my-0.5
              [&_a]:text-indigo-600 [&_a]:underline
              [&_strong]:font-semibold
              [&_table]:w-full [&_table]:text-sm
              [&_td]:p-1 [&_th]:p-1 [&_th]:text-left [&_th]:font-semibold"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(job.description),
            }}
          />
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Button
          asChild
          className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-none"
        >
          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Postuler sur JobUp
          </a>
        </Button>

        <Button
          variant="outline"
          onClick={onToggleSave}
          className={cn(
            isSaved && 'border-indigo-200 text-indigo-600'
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
        <h4 className="text-sm font-semibold text-gray-700">
          A propos de l'entreprise
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{job.company}</p>
            <p className="text-xs text-gray-500">{job.canton}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
