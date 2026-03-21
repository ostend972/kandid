import { eq, and, or, desc, sql, inArray, count } from 'drizzle-orm';
import { db } from './drizzle';
import {
  users,
  cvAnalyses,
  jobs,
  jobMatches,
  savedJobs,
  type NewKandidUser,
  type NewCvAnalysis,
  type NewJobMatch,
} from './schema';

// =============================================================================
// User Queries
// =============================================================================

export async function getUserById(id: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function upsertUser(data: {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}) {
  const [user] = await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email,
      fullName: data.fullName ?? null,
      avatarUrl: data.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: data.email,
        fullName: data.fullName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
}

export async function updateUserActiveCv(
  userId: string,
  cvAnalysisId: string | null
) {
  const [user] = await db
    .update(users)
    .set({
      activeCvAnalysisId: cvAnalysisId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

// =============================================================================
// CV Analysis Queries
// =============================================================================

export async function createCvAnalysis(data: {
  userId: string;
  fileName: string;
  fileUrl: string;
  imageUrl?: string | null;
  overallScore: number;
  profile: Record<string, unknown>;
  feedback: Record<string, unknown>;
}) {
  const [analysis] = await db
    .insert(cvAnalyses)
    .values({
      userId: data.userId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      imageUrl: data.imageUrl ?? null,
      overallScore: data.overallScore,
      profile: data.profile,
      feedback: data.feedback,
    })
    .returning();

  return analysis;
}

export async function getCvAnalysisById(id: string) {
  const result = await db
    .select()
    .from(cvAnalyses)
    .where(eq(cvAnalyses.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function getCvAnalysesByUserId(userId: string) {
  return db
    .select()
    .from(cvAnalyses)
    .where(eq(cvAnalyses.userId, userId))
    .orderBy(desc(cvAnalyses.createdAt));
}

export async function updateCvAnalysisResults(
  id: string,
  userId: string,
  data: { overallScore: number; profile: Record<string, unknown>; feedback: Record<string, unknown> }
) {
  const result = await db
    .update(cvAnalyses)
    .set({
      overallScore: data.overallScore,
      profile: data.profile,
      feedback: data.feedback,
    })
    .where(and(eq(cvAnalyses.id, id), eq(cvAnalyses.userId, userId)))
    .returning();

  return result[0] ?? null;
}

export async function deleteCvAnalysis(id: string, userId: string) {
  // Returns the deleted row (to get file paths for Storage cleanup)
  const result = await db
    .delete(cvAnalyses)
    .where(and(eq(cvAnalyses.id, id), eq(cvAnalyses.userId, userId)))
    .returning();

  if (result.length > 0) {
    // If this was the active CV, clear or set to most recent
    const user = await getUserById(userId);
    if (user?.activeCvAnalysisId === id) {
      const remaining = await getCvAnalysesByUserId(userId);
      await db
        .update(users)
        .set({ activeCvAnalysisId: remaining[0]?.id ?? null })
        .where(eq(users.id, userId));
    }
  }

  return result[0] ?? null;
}

// =============================================================================
// Job Queries
// =============================================================================

export async function getJobById(id: string) {
  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);

  return result[0] ?? null;
}

export interface SearchJobsFilters {
  cantons?: string[];
  contractTypes?: string[];
  query?: string;
  activityRate?: string;
  publishedSince?: string; // "24h" | "7d" | "30d"
  remoteOnly?: boolean;
  positionIds?: number[]; // 1=Management, 2=Cadre, 3=Employe
  industryId?: number;
  company?: string;
  language?: string; // "fr" | "de" | "en"
  page?: number;
  limit?: number;
}

export async function searchJobs(filters: SearchJobsFilters) {
  const {
    cantons,
    contractTypes,
    query,
    activityRate,
    publishedSince,
    remoteOnly,
    positionIds,
    industryId,
    company,
    language,
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(jobs.status, 'active')];

  if (cantons && cantons.length > 0) {
    conditions.push(inArray(jobs.canton, cantons));
  }

  if (contractTypes && contractTypes.length > 0) {
    conditions.push(inArray(jobs.contractType, contractTypes));
  }

  if (activityRate) {
    conditions.push(eq(jobs.activityRate, activityRate));
  }

  if (query && query.trim().length > 0) {
    conditions.push(
      sql`(
        to_tsvector('french', ${jobs.title} || ' ' || ${jobs.description})
        @@ plainto_tsquery('french', ${query})
      )`
    );
  }

  if (publishedSince) {
    const intervals: Record<string, string> = { "24h": "1 day", "7d": "7 days", "30d": "30 days" };
    const interval = intervals[publishedSince];
    if (interval) {
      conditions.push(sql`${jobs.publishedAt} > NOW() - INTERVAL '${sql.raw(interval)}'`);
    }
  }

  if (remoteOnly) {
    conditions.push(sql`${jobs.benefitIds}::text LIKE '%working-from-home%'`);
  }

  if (positionIds && positionIds.length > 0) {
    const posConditions = positionIds.map(
      (pid) => sql`${jobs.employmentPositionIds}::text LIKE ${'%' + pid + '%'}`
    );
    conditions.push(or(...posConditions)!);
  }

  if (industryId) {
    conditions.push(eq(jobs.industryId, industryId));
  }

  if (company && company.trim().length > 0) {
    conditions.push(sql`${jobs.company} ILIKE ${'%' + company.trim() + '%'}`);
  }

  if (language) {
    conditions.push(eq(jobs.language, language));
  }

  const whereClause = and(...conditions);

  // Get total count
  const [countResult] = await db
    .select({ total: count() })
    .from(jobs)
    .where(whereClause);

  // Get paginated results
  const results = await db
    .select()
    .from(jobs)
    .where(whereClause)
    .orderBy(desc(jobs.publishedAt))
    .limit(limit)
    .offset(offset);

  return {
    jobs: results,
    total: countResult?.total ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countResult?.total ?? 0) / limit),
  };
}

// =============================================================================
// Job Match Queries
// =============================================================================

export async function createJobMatch(data: {
  userId: string;
  cvAnalysisId: string;
  jobId: string;
  overallScore: number;
  verdict: string;
  requirements: Record<string, unknown>;
}) {
  const [match] = await db
    .insert(jobMatches)
    .values({
      userId: data.userId,
      cvAnalysisId: data.cvAnalysisId,
      jobId: data.jobId,
      overallScore: data.overallScore,
      verdict: data.verdict,
      requirements: data.requirements,
    })
    .onConflictDoUpdate({
      target: [jobMatches.cvAnalysisId, jobMatches.jobId],
      set: {
        overallScore: data.overallScore,
        verdict: data.verdict,
        requirements: data.requirements,
      },
    })
    .returning();

  return match;
}

export async function getJobMatch(cvAnalysisId: string, jobId: string) {
  const result = await db
    .select()
    .from(jobMatches)
    .where(
      and(
        eq(jobMatches.cvAnalysisId, cvAnalysisId),
        eq(jobMatches.jobId, jobId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

// =============================================================================
// Saved Jobs Queries
// =============================================================================

export async function saveJob(userId: string, jobId: string) {
  const [saved] = await db
    .insert(savedJobs)
    .values({ userId, jobId })
    .onConflictDoNothing({
      target: [savedJobs.userId, savedJobs.jobId],
    })
    .returning();

  return saved;
}

export async function unsaveJob(userId: string, jobId: string) {
  await db
    .delete(savedJobs)
    .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)));
}

export async function getSavedJobs(userId: string) {
  return db
    .select({
      savedJob: savedJobs,
      job: jobs,
    })
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .where(eq(savedJobs.userId, userId))
    .orderBy(desc(savedJobs.createdAt));
}

export async function getSavedJobIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ jobId: savedJobs.jobId })
    .from(savedJobs)
    .where(eq(savedJobs.userId, userId));

  return rows.map((r) => r.jobId);
}

// =============================================================================
// Stats Queries
// =============================================================================

export async function getUserStats(userId: string) {
  // Get latest CV analysis score
  const latestAnalysis = await db
    .select({ overallScore: cvAnalyses.overallScore })
    .from(cvAnalyses)
    .where(eq(cvAnalyses.userId, userId))
    .orderBy(desc(cvAnalyses.createdAt))
    .limit(1);

  // Get total analyses count
  const [analysesCount] = await db
    .select({ total: count() })
    .from(cvAnalyses)
    .where(eq(cvAnalyses.userId, userId));

  // Get saved jobs count
  const [savedCount] = await db
    .select({ total: count() })
    .from(savedJobs)
    .where(eq(savedJobs.userId, userId));

  return {
    lastScore: latestAnalysis[0]?.overallScore ?? null,
    totalAnalyses: analysesCount?.total ?? 0,
    savedJobsCount: savedCount?.total ?? 0,
  };
}
