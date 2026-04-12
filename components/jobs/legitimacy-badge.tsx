import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type LegitimacyTier = 'high' | 'caution' | 'suspicious';

const TIER_CONFIG: Record<LegitimacyTier, { label: string; icon: typeof ShieldCheck; className: string }> = {
  high: {
    label: 'Fiable',
    icon: ShieldCheck,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  caution: {
    label: 'À vérifier',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  suspicious: {
    label: 'Suspect',
    icon: ShieldAlert,
    className: 'bg-red-50 text-red-700 border-red-200',
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
