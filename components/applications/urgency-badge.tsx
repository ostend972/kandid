import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UrgencyLevel } from '@/lib/cadence';

const urgencyConfig: Record<UrgencyLevel, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
  overdue: { label: 'En retard', className: 'bg-orange-100 text-orange-800' },
  waiting: { label: 'En attente', className: 'bg-blue-100 text-blue-800' },
  cold: { label: 'Froid', className: 'bg-gray-100 text-gray-800' },
};

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const config = urgencyConfig[urgency];
  return (
    <Badge variant="outline" className={cn('border-transparent', config.className)}>
      {config.label}
    </Badge>
  );
}
