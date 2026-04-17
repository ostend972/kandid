import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  searchJobs,
  getUserById,
  getCvAnalysisById,
} from '@/lib/db/kandid-queries';
import { calculateMatchScore } from '@/lib/matching/score';
import type { ExtractedProfile } from '@/lib/ai/analyze-cv';

// =============================================================================
// GET /api/jobs
// =============================================================================
// Query params:
//   canton      — string (repeatable)   e.g. ?canton=Geneve&canton=Vaud
//   contractType — string               e.g. ?contractType=CDI
//   q           — string (FTS query)    e.g. ?q=developer
//   activityRate — string               e.g. ?activityRate=100%
//   sort        — "relevance" | "date"  default: "date"
//   page        — number                default: 1
//   limit       — number                default: 20 (max 100)
// =============================================================================

export async function GET(request: NextRequest) {
  // ── 1. Parse query parameters ───────────────────────────────────────
  const { searchParams } = request.nextUrl;

  const cantons = searchParams.getAll('canton').filter(Boolean);
  const contractType = searchParams.get('contractType');
  const query = searchParams.get('q') || undefined;
  const activityRate = searchParams.get('activityRate') || undefined;
  const publishedSince = searchParams.get('publishedSince') || undefined;
  const remoteOnly = searchParams.get('remoteOnly') === 'true';
  const positionIds = searchParams.getAll('positionId').map(Number).filter(Boolean);
  const industryId = searchParams.get('industryId') ? Number(searchParams.get('industryId')) : undefined;
  const company = searchParams.get('company') || undefined;
  const language = searchParams.get('language') || 'all'; // Default: all languages (fr+en in DB)
  const sort = searchParams.get('sort') || 'relevance';
  const minMatchScoreRaw = parseInt(
    searchParams.get('minMatchScore') || '0',
    10
  );
  const minMatchScore =
    Number.isFinite(minMatchScoreRaw) && minMatchScoreRaw > 0
      ? Math.min(100, Math.max(0, minMatchScoreRaw))
      : 0;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20)
  );

  // ── 2. Auth (optional — unauthenticated users can browse) ───────────
  let profile: ExtractedProfile | null = null;
  let preferredActivityRate: number | null = null;

  try {
    const { userId } = await auth();

    if (userId) {
      const user = await getUserById(userId);

      if (user?.activeCvAnalysisId) {
        const cvAnalysis = await getCvAnalysisById(user.activeCvAnalysisId);

        if (cvAnalysis?.profile) {
          profile = cvAnalysis.profile as unknown as ExtractedProfile;
        }
      }

      if (user?.preferredActivityRate != null) {
        preferredActivityRate = user.preferredActivityRate;
      }
    }
  } catch {
    // Auth failed or user not found — continue without profile
  }

  // ── 3. Search jobs using DB query ───────────────────────────────────
  const contractTypes = contractType ? [contractType] : undefined;

  // Score-aware pagination: whenever we need scores to order or filter results
  // (user has a CV AND is sorting by relevance, OR is filtering by min score),
  // we fetch a larger batch from the DB then score/sort/paginate in memory.
  // Otherwise we let the DB paginate directly by date.
  const needsInMemoryPagination =
    profile != null && (minMatchScore > 0 || sort === 'relevance');
  const BATCH_SIZE = 10000;

  const searchResult = await searchJobs({
    cantons: cantons.length > 0 ? cantons : undefined,
    contractTypes,
    query,
    activityRate,
    publishedSince,
    remoteOnly: remoteOnly || undefined,
    positionIds: positionIds.length > 0 ? positionIds : undefined,
    industryId,
    company,
    language: language === 'all' ? undefined : language,
    page: needsInMemoryPagination ? 1 : page,
    limit: needsInMemoryPagination ? BATCH_SIZE : limit,
  });

  // ── 4. Calculate match scores for returned jobs ─────────────────────
  const scoredJobs = searchResult.jobs.map((job) => {
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

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      canton: job.canton,
      contractType: job.contractType,
      activityRate: job.activityRate,
      publishedAt: job.publishedAt?.toISOString().split('T')[0] ?? null,
      sourceUrl: job.sourceUrl,
      source: job.source,
      matchScore,
      legitimacyTier: job.legitimacyTier ?? null,
      legitimacyScore: job.legitimacyScore ?? null,
    };
  });

  // ── 5. Apply match score filter + sort + paginate in memory when needed ─
  if (needsInMemoryPagination) {
    const filtered = minMatchScore > 0
      ? scoredJobs.filter((j) => (j.matchScore ?? 0) >= minMatchScore)
      : scoredJobs;
    // Default sort by score desc when relevance/score mode is active
    if (sort !== 'date') {
      filtered.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    } else {
      // sort=date already applied at DB level within the batch; keep order
    }
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    return NextResponse.json({
      jobs: paged,
      total,
      page,
      totalPages,
    });
  }

  // ── 6. Sort by relevance when requested and a profile exists ────────
  if (sort === 'relevance' && profile) {
    scoredJobs.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }

  // ── 7. Return response ─────────────────────────────────────────────
  return NextResponse.json({
    jobs: scoredJobs,
    total: searchResult.total,
    page: searchResult.page,
    totalPages: searchResult.totalPages,
  });
}
