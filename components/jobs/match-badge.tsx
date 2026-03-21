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
          'inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-400',
          className
        )}
        title="Analysez votre CV pour voir votre compatibilite"
      >
        <HelpCircle className="h-4 w-4" />
      </span>
    );
  }

  const ringColor =
    score >= 80
      ? 'text-emerald-500'
      : score >= 40
        ? 'text-amber-500'
        : 'text-red-500';

  const bgColor =
    score >= 80
      ? 'bg-emerald-50'
      : score >= 40
        ? 'bg-amber-50'
        : 'bg-red-50';

  const textColor =
    score >= 80
      ? 'text-emerald-700'
      : score >= 40
        ? 'text-amber-700'
        : 'text-red-700';

  // SVG circle progress
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      title={`Compatibilite : ${score}%`}
    >
      <svg width="44" height="44" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={ringColor}
        />
      </svg>
      <span className={cn('absolute text-xs font-bold', textColor)}>
        {score}
      </span>
    </div>
  );
}
