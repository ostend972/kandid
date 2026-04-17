import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UrgencyLevel } from '@/lib/cadence';

const urgencyConfig: Record<UrgencyLevel, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400' },
  overdue: { label: 'En retard', className: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400' },
  waiting: { label: 'En attente', className: 'bg-muted text-foreground' },
  cold: { label: 'Froid', className: 'bg-muted text-muted-foreground' },
};

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const config = urgencyConfig[urgency];
  return (
    <Badge variant="outline" className={cn('border-transparent', config.className)}>
      {config.label}
    </Badge>
  );
}
