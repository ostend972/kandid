import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getTopMatchesForUser } from '@/lib/db/kandid-queries';

function matchAccent(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export async function TopMatchesStrip({
  userId,
  activeCvId,
}: {
  userId: string;
  activeCvId: string | null;
}) {
  if (!activeCvId) return null;

  const matches = await getTopMatchesForUser(userId, activeCvId);
  if (matches.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-background p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Top matchs
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Les 5 offres les plus proches de votre profil</h2>
        </div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-opacity hover:opacity-70"
        >
          Toutes les offres
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="mt-6 divide-y divide-border">
        {matches.map((match) => (
          <li key={match.jobId}>
            <Link
              href={`/dashboard/jobs/${match.jobId}`}
              className="group flex items-center gap-5 py-4 transition-colors"
            >
              <div className="flex w-14 shrink-0 items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${matchAccent(match.overallScore)}`} />
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {match.overallScore}%
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium group-hover:underline">
                  {match.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {match.company} · {match.canton}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
