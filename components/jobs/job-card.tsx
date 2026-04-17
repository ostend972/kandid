'use client';

import { MapPin, Bookmark, BookmarkCheck, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

/**
 * Format a date string as a relative French date.
 */
function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';

  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Bientot';
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 14) return 'Il y a 1 semaine';
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return `Il y a ${weeks} semaines`;
  const months = Math.floor(diffDays / 30);
  if (months <= 1) return 'Il y a 1 mois';
  return `Il y a ${months} mois`;
}

export function JobCard({
  job,
  isActive,
  isSaved,
  isApplied = false,
  onSelect,
  onToggleSave,
}: JobCardProps) {
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
        'relative rounded-lg border bg-card p-4 cursor-pointer transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]',
        isActive
          ? 'border-foreground ring-1 ring-foreground shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
          : 'border-border hover:border-foreground/40'
      )}
    >
      {/* Top row: title + match badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
            {job.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{job.company}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isApplied && (
            <Badge
              variant="secondary"
              className="bg-muted text-foreground border-border text-xs px-2 py-0 gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              Postulé
            </Badge>
          )}
          <MatchBadge score={job.matchScore} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {job.canton}
        </span>

        {job.publishedAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {formatRelativeDate(job.publishedAt)}
          </span>
        )}

        {job.activityRate && (
          <span>{job.activityRate}</span>
        )}
      </div>

      {/* Bottom row: badges + save */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {job.contractType && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0 bg-muted text-foreground border-border"
            >
              {job.contractType}
            </Badge>
          )}
          <LegitimacyBadge tier={job.legitimacyTier} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 shrink-0',
            isSaved
              ? 'text-foreground hover:text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          title={isSaved ? 'Retirer des favoris' : 'Sauvegarder'}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 fill-current" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for job cards.
 */
export function JobCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3.5 bg-muted rounded w-1/2" />
        </div>
        <div className="h-5 w-16 bg-muted rounded-full" />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div className="h-3 bg-muted rounded w-20" />
        <div className="h-3 bg-muted rounded w-24" />
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="h-5 w-12 bg-muted rounded-full" />
        <div className="h-7 w-7 bg-muted rounded" />
      </div>
    </div>
  );
}
