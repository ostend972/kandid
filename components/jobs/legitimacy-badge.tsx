import { cn } from '@/lib/utils';

type LegitimacyTier = 'high' | 'caution' | 'suspicious';

const TIER_CONFIG: Record<
  LegitimacyTier,
  { label: string; className: string }
> = {
  high: {
    label: 'Fiable',
    className: 'bg-foreground text-background border-foreground',
  },
  caution: {
    label: 'À vérifier',
    className: 'bg-background text-foreground border-border',
  },
  suspicious: {
    label: 'Suspect',
    className:
      'bg-background text-muted-foreground border-dashed border-muted-foreground/40',
  },
};

interface LegitimacyBadgeProps {
  tier: string | null;
  score?: number | null;
  className?: string;
}

export function LegitimacyBadge({ tier, score, className }: LegitimacyBadgeProps) {
  if (!tier || !(tier in TIER_CONFIG)) return null;

  const config = TIER_CONFIG[tier as LegitimacyTier];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em]',
        config.className,
        className
      )}
    >
      {config.label}
      {score != null && <span className="opacity-70 normal-case tracking-normal">· {score}</span>}
    </span>
  );
}
