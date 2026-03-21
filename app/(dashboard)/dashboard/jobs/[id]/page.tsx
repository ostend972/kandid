import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getJobById,
  getUserById,
  getCvAnalysisById,
  getSavedJobIds,
} from '@/lib/db/kandid-queries';
import { calculateMatchScore } from '@/lib/matching/score';
import type { ExtractedProfile } from '@/lib/ai/analyze-cv';
import { JobDetailMobileClient } from './detail-client';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;

  const job = await getJobById(id);
  if (!job) {
    notFound();
  }

  // Auth + match score
  let matchScore: number | null = null;
  let hasCvAnalysis = false;
  let isSaved = false;

  try {
    const { userId } = await auth();

    if (userId) {
      // Check if job is saved
      const savedIds = await getSavedJobIds(userId);
      isSaved = savedIds.includes(job.id);

      // Check for CV analysis
      const user = await getUserById(userId);

      if (user?.activeCvAnalysisId) {
        hasCvAnalysis = true;
        const cvAnalysis = await getCvAnalysisById(user.activeCvAnalysisId);

        if (cvAnalysis?.profile) {
          const profile = cvAnalysis.profile as unknown as ExtractedProfile;

          const jobInput = {
            skills: (job.skills as string[]) ?? [],
            languageSkills:
              (job.languageSkills as Array<{
                language: string;
                level: string;
              }>) ?? [],
            categories:
              (job.categories as Array<{
                id: number;
                name: string;
              }>) ?? [],
            activityRate: job.activityRate,
          };

          const result = calculateMatchScore(
            profile,
            jobInput,
            user.preferredActivityRate
          );
          matchScore = result.score;
        }
      }
    }
  } catch {
    // Auth failed — continue without
  }

  const jobData = {
    id: job.id,
    title: job.title,
    company: job.company,
    canton: job.canton,
    contractType: job.contractType,
    activityRate: job.activityRate,
    publishedAt: job.publishedAt?.toISOString().split('T')[0] ?? null,
    sourceUrl: job.sourceUrl,
    description: job.description,
    salary: job.salary,
    matchScore,
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link href="/dashboard/jobs">
          <ArrowLeft className="h-4 w-4" />
          Retour aux offres
        </Link>
      </Button>

      {/* Job detail (client component to handle save toggle) */}
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <JobDetailMobileClient
          job={jobData}
          initialIsSaved={isSaved}
          hasCvAnalysis={hasCvAnalysis}
        />
      </div>
    </div>
  );
}
