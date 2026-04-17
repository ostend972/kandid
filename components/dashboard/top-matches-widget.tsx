import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTopMatchesForUser } from '@/lib/db/kandid-queries';
import { Briefcase } from 'lucide-react';

function scoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 border-transparent';
  if (score >= 50) return 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 border-transparent';
  return 'bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400 border-transparent';
}

export async function TopMatchesWidget({
  userId,
  activeCvId,
}: {
  userId: string;
  activeCvId: string | null;
}) {
  if (!activeCvId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Matchs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Parcourez les offres pour voir vos meilleurs matchs
            </p>
            <Link
              href="/dashboard/jobs"
              className="mt-2 text-sm font-medium text-foreground hover:text-muted-foreground"
            >
              Voir les offres →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const matches = await getTopMatchesForUser(userId, activeCvId);

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Matchs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Parcourez les offres pour voir vos meilleurs matchs
            </p>
            <Link
              href="/dashboard/jobs"
              className="mt-2 text-sm font-medium text-foreground hover:text-muted-foreground"
            >
              Voir les offres →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top 5 Matchs</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {matches.map((match) => (
            <li key={match.jobId}>
              <Link
                href={`/dashboard/jobs/${match.jobId}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
              >
                <Badge
                  variant="outline"
                  className={scoreBadgeClass(match.overallScore)}
                >
                  {match.overallScore}%
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{match.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {match.company} · {match.canton}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
