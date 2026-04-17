import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/lib/db/schema';

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-muted text-foreground' },
  applied: { label: 'Postulé', className: 'bg-muted text-foreground' },
  screening: { label: 'Présélection', className: 'bg-muted text-foreground' },
  interview: { label: 'Entretien', className: 'bg-muted text-foreground' },
  offer: { label: 'Offre', className: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400' },
  accepted: { label: 'Accepté', className: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400' },
  rejected: { label: 'Refusé', className: 'bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400' },
  withdrawn: { label: 'Retiré', className: 'bg-muted text-muted-foreground' },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('border-transparent', config.className)}>
      {config.label}
    </Badge>
  );
}
