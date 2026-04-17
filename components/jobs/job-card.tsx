'use client';

import { Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import { MatchBadge } from './match-badge';
import { LegitimacyBadge } from './legitimacy-badge';
import { cn } from '@/lib/utils';

export interface JobCardData {
  id: string;
  title: string;
  company: string;
  canton: string;
  contractType: string | null;
  activityRate: string | null;
  publishedAt: string | null;
  sourceUrl: string;
  matchScore: number | null;
  legitimacyTier: string | null;
}

interface JobCardProps {
  job: JobCardData;
  isActive: boolean;
  isSaved: boolean;
  isApplied?: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);
  if (diffDays < 0) return 'Bientôt';
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 14) return 'Il y a 1 semaine';
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return `Il y a ${weeks} semaines`;
  const months = Math.floor(diffDays / 30);
  return months <= 1 ? 'Il y a 1 mois' : `Il y a ${months} mois`;
}

export function JobCard({
  job,
  isActive,
  isSaved,
  isApplied = false,
  onSelect,
  onToggleSave,
}: JobCardProps) {
  const eyebrow = [
    formatRelativeDate(job.publishedAt),
    job.canton,
    job.contractType,
    job.activityRate,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group relative rounded-3xl border bg-background p-5 sm:p-6 cursor-pointer transition-all',
        isActive
          ? 'border-foreground ring-2 ring-foreground'
          : 'border-border hover:border-foreground/60 hover:-translate-y-px'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h3 className="mt-2 text-base font-bold tracking-tight text-foreground leading-snug line-clamp-2 sm:text-lg">
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
            {job.company}
          </p>
        </div>
        <MatchBadge score={job.matchScore} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <LegitimacyBadge tier={job.legitimacyTier} />
          {isApplied && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-foreground">
              <CheckCircle2 className="h-3 w-3" />
              Postulé
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
            isSaved
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
          )}
          title={isSaved ? 'Retirer des favoris' : 'Sauvegarder'}
          aria-label={isSaved ? 'Retirer des favoris' : 'Sauvegarder'}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 fill-current" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-background p-5 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-2.5 w-40 rounded bg-muted" />
          <div className="h-5 w-5/6 rounded bg-muted" />
          <div className="h-3.5 w-1/2 rounded bg-muted" />
        </div>
        <div className="h-12 w-12 rounded-full bg-muted" />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-muted" />
        <div className="h-8 w-8 rounded-full bg-muted" />
      </div>
    </div>
  );
}
