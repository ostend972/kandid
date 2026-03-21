'use client';

import { MapPin, Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MatchBadge } from './match-badge';
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
}

interface JobCardProps {
  job: JobCardData;
  isActive: boolean;
  isSaved: boolean;
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
        'relative rounded-lg border bg-card p-4 cursor-pointer transition-all hover:shadow-md',
        isActive
          ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md'
          : 'border-border hover:border-gray-300'
      )}
    >
      {/* Top row: title + match badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
            {job.title}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{job.company}</p>
        </div>
        <MatchBadge score={job.matchScore} className="shrink-0" />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
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
              className={cn(
                'text-xs px-2 py-0',
                job.contractType === 'CDI'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              {job.contractType}
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 shrink-0',
            isSaved
              ? 'text-indigo-600 hover:text-indigo-700'
              : 'text-gray-400 hover:text-gray-600'
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
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3.5 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="h-5 w-12 bg-gray-200 rounded-full" />
        <div className="h-7 w-7 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
