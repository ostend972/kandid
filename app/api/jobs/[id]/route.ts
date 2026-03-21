import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getJobById,
  getUserById,
  getCvAnalysisById,
} from '@/lib/db/kandid-queries';
import { calculateMatchScore } from '@/lib/matching/score';
import type { ExtractedProfile } from '@/lib/ai/analyze-cv';

// =============================================================================
// GET /api/jobs/[id] — Returns full job data for detail view
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await getJobById(id);
  if (!job) {
    return NextResponse.json({ error: 'Offre non trouvee' }, { status: 404 });
  }

  // Calculate match score if user has a CV analysis
  let matchScore: number | null = null;
  let hasCvAnalysis = false;
  let cvAnalysisId: string | null = null;
  let cvFileName: string | null = null;

  try {
    const { userId } = await auth();

    if (userId) {
      const user = await getUserById(userId);

      if (user?.activeCvAnalysisId) {
        hasCvAnalysis = true;
        const cvAnalysis = await getCvAnalysisById(user.activeCvAnalysisId);

        if (cvAnalysis) {
          cvAnalysisId = cvAnalysis.id;
          cvFileName = cvAnalysis.fileName;

          if (cvAnalysis.profile) {
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
    }
  } catch {
    // Auth failed — continue without score
  }

  return NextResponse.json({
    job: {
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
    },
    hasCvAnalysis,
    cvAnalysisId,
    cvFileName,
  });
}
