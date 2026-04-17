'use client';

import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface MatchBadgeProps {
  score: number | null;
  className?: string;
  size?: 'sm' | 'lg';
}

export function MatchBadge({ score, className, size = 'sm' }: MatchBadgeProps) {
  const isLarge = size === 'lg';

  if (score === null || score === undefined) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-border bg-background text-muted-foreground',
          isLarge ? 'h-28 w-28' : 'h-12 w-12',
          className
        )}
        title="Analysez votre CV pour voir votre compatibilité"
      >
        <HelpCircle className={cn(isLarge ? 'h-6 w-6' : 'h-4 w-4')} />
      </span>
    );
  }

  // Bichrome intensity : plus le score est haut, plus le remplissage est opaque.
  const dim = score >= 80 ? 1 : score >= 60 ? 0.7 : score >= 40 ? 0.45 : 0.22;

  const px = isLarge ? 112 : 48;
  const strokeW = isLarge ? 6 : 3;
  const center = px / 2;
  const radius = center - strokeW;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      title={`Compatibilité : ${score}%`}
      style={{ width: px, height: px }}
    >
      <svg width={px} height={px} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeW}
          className="text-border"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="text-foreground"
          style={{ opacity: dim }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-bold tabular-nums leading-none text-foreground',
            isLarge ? 'text-4xl' : 'text-base'
          )}
        >
          {score}
        </span>
        {isLarge && (
          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            / 100
          </span>
        )}
      </div>
    </div>
  );
}
