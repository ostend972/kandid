import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  runFullHealthCheck,
  type OrphanedApplication,
  type InconsistentStatus,
  type DuplicateCluster,
} from '@/lib/pipeline-health';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as Record<string, unknown>)?.role;
    if (role !== 'admin') redirect('/dashboard');
  } catch {
    redirect('/dashboard');
  }
}

function truncateId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

function StatusBadge({ status }: { status: 'healthy' | 'warnings' | 'errors' }) {
  if (status === 'healthy') {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Sain
      </Badge>
    );
  }
  if (status === 'warnings') {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Avertissements
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
      <XCircle className="mr-1 h-3 w-3" />
      Erreurs
    </Badge>
  );
}

function OrphanReasonLabel({ reason }: { reason: OrphanedApplication['reason'] }) {
  const labels: Record<OrphanedApplication['reason'], string> = {
    'job-orphaned': 'Job manquant',
    stale: 'Inactive',
    'transition-orphaned': 'Sans historique',
  };
  return <span>{labels[reason]}</span>;
}

function OrphansSection({ items }: { items: OrphanedApplication[] }) {
  if (items.length === 0) return null;

  const grouped = {
    'job-orphaned': items.filter((i) => i.reason === 'job-orphaned'),
    stale: items.filter((i) => i.reason === 'stale'),
    'transition-orphaned': items.filter((i) => i.reason === 'transition-orphaned'),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Candidatures orphelines ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(grouped).map(([reason, group]) => {
          if (group.length === 0) return null;
          return (
            <div key={reason}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                <OrphanReasonLabel reason={reason as OrphanedApplication['reason']} /> ({group.length})
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>ID Candidature</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.map((item) => (
                    <TableRow key={item.applicationId}>
                      <TableCell>
                        <OrphanReasonLabel reason={item.reason} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncateId(item.applicationId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.detail}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function InconsistenciesSection({ items }: { items: InconsistentStatus[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Incohérences de statut ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={`${item.applicationId}-${item.issue}-${idx}`}>
                <TableCell>
                  <Badge variant="outline">
                    {item.issue === 'status-mismatch' ? 'Desynchronise' : 'Valeur invalide'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {truncateId(item.applicationId)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.detail}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DuplicatesSection({ items }: { items: DuplicateCluster[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Doublons ({items.length} clusters)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((cluster, idx) => (
          <div key={idx} className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Utilisateur:</span>{' '}
              <span className="font-mono text-xs">{truncateId(cluster.userId)}</span>
              {' — '}
              <span className="font-medium">{cluster.jobTitle}</span>
              {' chez '}
              <span className="font-medium">{cluster.jobCompany}</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Cree le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cluster.applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs">
                      {truncateId(app.id)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString('fr-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default async function PipelineHealthPage() {
  await assertAdmin();

  const report = await runFullHealthCheck();
  const { checks, summary } = report;

  const timestamp = new Date(summary.checkedAt).toLocaleString('fr-CH', {
    dateStyle: 'long',
    timeStyle: 'medium',
  });

  if (summary.totalIssues === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Pipeline Health</h1>
          <p className="text-sm text-muted-foreground">{timestamp}</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-xl font-semibold text-green-700 dark:text-green-400">
              Pipeline saine — aucun problème détecté
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pipeline Health</h1>
        <p className="text-sm text-muted-foreground">{timestamp}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <StatusBadge status={summary.status} />
                <span className="text-2xl font-bold">{summary.totalIssues} problèmes</span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                <span>Orphelins: {checks.orphanedApplications.length}</span>
                <span>Incohérences: {checks.inconsistentStatuses.length}</span>
                <span>Doublons: {checks.duplicates.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <OrphansSection items={checks.orphanedApplications} />
      <InconsistenciesSection items={checks.inconsistentStatuses} />
      <DuplicatesSection items={checks.duplicates} />
    </div>
  );
}
