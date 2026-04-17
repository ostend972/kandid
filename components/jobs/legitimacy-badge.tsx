import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type LegitimacyTier = 'high' | 'caution' | 'suspicious';

const TIER_CONFIG: Record<LegitimacyTier, { label: string; icon: typeof ShieldCheck; className: string }> = {
  high: {
    label: 'Fiable',
    icon: ShieldCheck,
    className: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 border-transparent',
  },
  caution: {
    label: 'À vérifier',
    icon: AlertTriangle,
    className: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 border-transparent',
  },
  suspicious: {
    label: 'Suspect',
    icon: ShieldAlert,
    className: 'bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400 border-transparent',
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
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('text-xs px-2 py-0 gap-1', config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
      {score != null && <span className="opacity-75">({score})</span>}
    </Badge>
  );
}
