import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Briefcase, MapPin, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MatchBadge } from '@/components/jobs/match-badge';
import { getSavedJobs, getUserById, getCvAnalysisById } from '@/lib/db/kandid-queries';
import { calculateMatchScore } from '@/lib/matching/score';
import type { ExtractedProfile } from '@/lib/ai/analyze-cv';
import { UnsaveJobButton } from './unsave-job-button';
import { SortToggle, PostulerButton } from './saved-jobs-client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(dateStr: string | Date | null): string {
  if (!dateStr) return '';

  const date = typeof dateStr === 'string'
    ? new Date(dateStr + 'T00:00:00')
    : dateStr;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Bientot';
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 14) return 'Il y a 1 semaine';
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return `Il y a ${weeks} semaines`;
  const months = Math.floor(diffDays / 30);
  if (months <= 1) return 'Il y a 1 mois';
  return `Il y a ${months} mois`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function SavedJobsPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const resolvedParams = await searchParams;
  const sortBy = resolvedParams.sort === 'score' ? 'score' : 'date';

  // Fetch saved jobs + user profile for match scoring
  const [savedJobs, user] = await Promise.all([
    getSavedJobs(userId),
    getUserById(userId),
  ]);

  // Load CV profile for match score computation
  let profile: ExtractedProfile | null = null;
  const activeCvAnalysisId = user?.activeCvAnalysisId ?? null;
  const preferredActivityRate = user?.preferredActivityRate ?? null;

  if (activeCvAnalysisId) {
    const cvAnalysis = await getCvAnalysisById(activeCvAnalysisId);
    if (cvAnalysis?.profile) {
      profile = cvAnalysis.profile as unknown as ExtractedProfile;
    }
  }

  // Compute match scores for each saved job
  const jobsWithScores = savedJobs.map(({ savedJob, job }) => {
    let matchScore: number | null = null;

    if (profile) {
      const jobInput = {
        skills: (job.skills as string[]) ?? [],
        languageSkills: (job.languageSkills as Array<{
          language: string;
          level: string;
        }>) ?? [],
        categories: (job.categories as Array<{
          id: number;
          name: string;
        }>) ?? [],
        activityRate: job.activityRate,
        title: job.title,
        description: job.description,
      };

      const result = calculateMatchScore(
        profile,
        jobInput,
        preferredActivityRate
      );
      matchScore = result.score;
    }

    return { savedJob, job, matchScore };
  });

  // Sort based on user preference
  const sortedJobs = [...jobsWithScores].sort((a, b) => {
    if (sortBy === 'score') {
      // Sort by score descending, nulls last
      const scoreA = a.matchScore ?? -1;
      const scoreB = b.matchScore ?? -1;
      return scoreB - scoreA;
    }
    // Default: date (most recently saved first) — already sorted by DB query
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Offres sauvegardees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {savedJobs.length > 0
              ? `${savedJobs.length} offre${savedJobs.length > 1 ? 's' : ''} sauvegardee${savedJobs.length > 1 ? 's' : ''}`
              : 'Retrouvez toutes les offres que vous avez mises de cote.'}
          </p>
        </div>

        {savedJobs.length > 1 && (
          <SortToggle currentSort={sortBy} />
        )}
      </div>

      {/* Job cards */}
      {sortedJobs.length > 0 ? (
        <div className="space-y-3">
          {sortedJobs.map(({ savedJob, job, matchScore }) => (
            <Card
              key={savedJob.id}
              className="transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            >
              <CardContent className="flex items-start gap-4 p-5">
                {/* Main content — clickable link */}
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex-1 min-w-0 group"
                >
                  {/* Title + company */}
                  <h3 className="font-semibold text-foreground group-hover:text-muted-foreground transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {job.company}
                  </p>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {job.canton}
                    </span>
                    {job.contractType && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0 bg-muted text-foreground border-border"
                      >
                        {job.contractType}
                      </Badge>
                    )}
                    {job.activityRate && (
                      <span className="text-muted-foreground">
                        {job.activityRate}
                      </span>
                    )}
                    {job.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {formatRelativeDate(
                          job.publishedAt instanceof Date
                            ? job.publishedAt.toISOString().split('T')[0]
                            : job.publishedAt
                        )}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Right side: match badge + actions */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <MatchBadge score={matchScore} />

                  <div className="flex items-center gap-1.5">
                    {activeCvAnalysisId && (
                      <PostulerButton
                        jobId={job.id}
                        jobTitle={job.title}
                        jobCompany={job.company}
                        jobSourceUrl={job.sourceUrl}
                        cvAnalysisId={activeCvAnalysisId}
                      />
                    )}
                    <UnsaveJobButton jobId={job.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-bold tracking-tight text-foreground">
              Aucune offre sauvegardee
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Sauvegardez des offres pour les retrouver ici.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/jobs">
                <Briefcase className="mr-2 h-4 w-4" />
                Chercher des offres
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
