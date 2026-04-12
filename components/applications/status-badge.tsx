import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/lib/db/schema';

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
  applied: { label: 'Postulé', className: 'bg-blue-100 text-blue-800' },
  screening: { label: 'Présélection', className: 'bg-indigo-100 text-indigo-800' },
  interview: { label: 'Entretien', className: 'bg-purple-100 text-purple-800' },
  offer: { label: 'Offre', className: 'bg-green-100 text-green-800' },
  accepted: { label: 'Accepté', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Refusé', className: 'bg-red-100 text-red-800' },
  withdrawn: { label: 'Retiré', className: 'bg-gray-100 text-gray-600' },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('border-transparent', config.className)}>
      {config.label}
    </Badge>
  );
}
