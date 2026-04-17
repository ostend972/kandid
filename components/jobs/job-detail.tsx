'use client';

import { useState, useEffect } from 'react';
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  FileText,
  Send,
  ArrowRight,
} from 'lucide-react';
import { ApplyWizard } from '@/components/application/apply-wizard';
import { MatchBadge } from './match-badge';
import { MatchBreakdown } from './match-breakdown';
import { LegitimacyBadge } from './legitimacy-badge';
import { EmptyJobIllustration } from './empty-illustration';
import { cn } from '@/lib/utils';
import { sourceLabel } from '@/lib/source-label';
import { formatJobDescription } from '@/lib/format-description';
import { sanitizeHtml } from '@/lib/sanitize';

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

const CANTON_LABELS: Record<string, string> = {
  GE: 'Genève',
  VD: 'Vaud',
  VS: 'Valais',
  NE: 'Neuchâtel',
  FR: 'Fribourg',
  JU: 'Jura',
  BE: 'Berne',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getMatchVerdict(score: number): string {
  if (score >= 80) return 'Alignement excellent';
  if (score >= 60) return 'Bon alignement';
  if (score >= 40) return 'Alignement partiel';
  return 'Alignement faible';
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
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
  const [aiScore, setAiScore] = useState<number | null>(null);

  useEffect(() => {
    setShowBreakdown(false);
    setAiScore(null);
  }, [job?.id]);

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[480px] text-center p-8">
        <EmptyJobIllustration className="w-48 h-40 text-foreground mb-6" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Aucune offre sélectionnée
        </p>
        <h3 className="mt-3 text-xl font-bold tracking-tight text-foreground">
          Choisissez une offre pour lire les détails
        </h3>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
          Kandid affiche ici la description complète, votre score d&apos;alignement et les actions
          pour postuler en un clic.
        </p>
      </div>
    );
  }

  const displayScore = aiScore ?? job.matchScore;
  const verdict = displayScore !== null ? getMatchVerdict(displayScore) : null;
  const cantonLabel = CANTON_LABELS[job.canton] ?? job.canton;

  const eyebrowMeta = [
    job.publishedAt ? formatDate(job.publishedAt) : null,
    cantonLabel,
    job.contractType,
    job.activityRate,
    job.salary,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-10">
      {/* Header — display typography + grand cercle */}
      <header className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          {eyebrowMeta && <SectionEyebrow>{eyebrowMeta}</SectionEyebrow>}
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground leading-tight sm:text-3xl">
            {job.title}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            {job.company}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <LegitimacyBadge tier={job.legitimacyTier ?? null} score={job.legitimacyScore} />
          </div>
        </div>
        <div className="shrink-0">
          <MatchBadge score={displayScore} size="lg" />
        </div>
      </header>

      {/* CTA group */}
      <div className="flex flex-wrap items-center gap-3">
        {hasCvAnalysis && cvAnalysisId ? (
          <ApplyWizard
            jobId={job.id}
            jobTitle={job.title}
            jobCompany={job.company}
            cvAnalysisId={cvAnalysisId}
            jobSourceUrl={job.sourceUrl}
            trigger={
              <button
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Send className="h-4 w-4" />
                Postuler
              </button>
            }
          />
        ) : (
          <a
            href="/dashboard/cv-analysis"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <FileText className="h-4 w-4" />
            Analyser mon CV d&apos;abord
            <ArrowRight className="h-4 w-4" />
          </a>
        )}

        <a
          href={job.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Voir sur {sourceLabel(job.source)}
        </a>

        <button
          type="button"
          onClick={onToggleSave}
          className={cn(
            'inline-flex h-12 items-center gap-2 rounded-full border px-6 text-sm font-medium transition-colors',
            isSaved
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-background text-foreground hover:border-foreground'
          )}
          aria-pressed={isSaved}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-4 w-4 fill-current" />
              Sauvegardée
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              Sauvegarder
            </>
          )}
        </button>
      </div>

      {/* Compatibilité */}
      {hasCvAnalysis && displayScore !== null && verdict && (
        <section className="space-y-4 border-t border-border pt-8">
          <SectionEyebrow>Compatibilité</SectionEyebrow>

          {showBreakdown && cvAnalysisId ? (
            <MatchBreakdown
              jobId={job.id}
              cvAnalysisId={cvAnalysisId}
              cvFileName={cvFileName || 'CV'}
              onScoreLoaded={(score) => setAiScore(score)}
            />
          ) : (
            <div className="rounded-3xl border border-border bg-background p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Score algorithmique
                  </p>
                  <p className="mt-2 text-lg font-bold tracking-tight text-foreground">
                    {verdict}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Calcul basé sur vos cantons cibles, votre secteur et votre parcours. Pour une
                    analyse fine avec justifications, lancez l&apos;analyse IA détaillée.
                  </p>
                </div>
                <div className="shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-5xl font-bold tabular-nums leading-none text-foreground">
                      {displayScore}
                    </span>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      / 100
                    </span>
                  </div>
                </div>
              </div>

              {cvAnalysisId && (
                <button
                  type="button"
                  onClick={() => setShowBreakdown(true)}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Voir l&apos;analyse détaillée
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Description */}
      {job.description && (
        <section className="space-y-4 border-t border-border pt-8">
          <SectionEyebrow>Description du poste</SectionEyebrow>
          <div
            className="prose prose-sm prose-gray max-w-none break-words overflow-hidden
              [overflow-wrap:anywhere]
              [&_*]:max-w-full [&_*]:overflow-wrap-anywhere
              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:text-foreground
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-foreground
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-foreground
              [&_p]:text-sm [&_p]:text-foreground [&_p]:leading-relaxed [&_p]:my-2
              [&_br]:block [&_br]:content-[''] [&_br]:my-1
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
              [&_li]:text-sm [&_li]:text-foreground [&_li]:my-0.5
              [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4
              [&_strong]:font-semibold [&_strong]:text-foreground
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
        </section>
      )}

      {/* Entreprise */}
      <section className="space-y-4 border-t border-border pt-8">
        <SectionEyebrow>Entreprise</SectionEyebrow>
        <div className="rounded-3xl border border-border bg-background p-6">
          <p className="text-lg font-bold tracking-tight text-foreground">
            {job.company}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {cantonLabel}
            {job.contractType ? ` · ${job.contractType}` : ''}
          </p>
        </div>
      </section>
    </div>
  );
}
