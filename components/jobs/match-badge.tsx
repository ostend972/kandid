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
          'inline-flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground',
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

  const textColor =
    score >= 80
      ? 'text-emerald-700 dark:text-emerald-400'
      : score >= 40
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-red-700 dark:text-red-400';

  // SVG circle progress
  const size = 52;
  const center = size / 2;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      title={`Compatibilite : ${score}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-border"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={ringColor}
        />
      </svg>
      <span className={cn('absolute text-sm font-bold', textColor)}>
        {score}
      </span>
    </div>
  );
}
