'use client';

import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface MatchBadgeProps {
  score: number | null;
  className?: string;
}

export function MatchBadge({ score, className }: MatchBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-400',
          className
        )}
        title="Analysez votre CV pour voir votre compatibilite"
      >
        <HelpCircle className="h-3 w-3" />
      </span>
    );
  }

  const colorClasses =
    score >= 80
      ? 'bg-emerald-100 text-emerald-700'
      : score >= 40
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        colorClasses,
        className
      )}
    >
      Match {score}%
    </span>
  );
}
