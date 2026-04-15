import { eq, and, or, desc, asc, sql, inArray, count, gte, lte, isNotNull } from 'drizzle-orm';
import { db } from './drizzle';
import {
  users,
  cvAnalyses,
  jobs,
  jobMatches,
  savedJobs,
  candidateDocuments,
  candidateReferences,
  applications,
  applicationTransitions,
  aiGenerationsLog,
  linkedinProfiles,
  linkedinPosts,
  savedSearches,
  type NewKandidUser,
  type NewCvAnalysis,
  type NewJobMatch,
  type NewCandidateDocument,
  type NewCandidateReference,
  type NewApplication,
  type ApplicationStatus,
  type NewLinkedinProfile,
  type NewLinkedinPost,
} from './schema';
import type { InterviewPrepData } from '../ai/interview-prep';
import { isValidTransition, computeNextFollowUpDate } from '../cadence';

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
// Onboarding Queries
// =============================================================================

export async function updateUserOnboardingStep1(
  userId: string,
  data: {
    sector: string;
    position: string;
    experienceLevel: string;
    targetCantons: string[];
    languages: { lang: string; level: string }[];
    salaryExpectation: string;
    availability: string;
    contractTypes: string[];
  }
) {
  const [user] = await db
    .update(users)
    .set({
      sector: data.sector,
      position: data.position,
      experienceLevel: data.experienceLevel,
      targetCantons: data.targetCantons,
      languages: data.languages,
      salaryExpectation: data.salaryExpectation,
      availability: data.availability,
      contractTypes: data.contractTypes,
      onboardingStep: 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

export async function updateUserOnboardingStep2(
  userId: string,
  data: {
    careerSummary: string;
    strengths: string[];
    motivation: string;
    differentiator: string;
  }
) {
  const [user] = await db
    .update(users)
    .set({
      careerSummary: data.careerSummary,
      strengths: data.strengths,
      motivation: data.motivation,
      differentiator: data.differentiator,
      onboardingStep: 2,
      onboardingCompletedAt: new Date(),
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

export async function getAppliedJobIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ jobId: applications.jobId })
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        isNotNull(applications.jobId),
      )
    );

  return rows
    .filter((r): r is { jobId: string } => r.jobId !== null)
    .map((r) => r.jobId);
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

// =============================================================================
// Candidate Documents Queries
// =============================================================================

export async function getCandidateDocuments(userId: string) {
  return db
    .select()
    .from(candidateDocuments)
    .where(eq(candidateDocuments.userId, userId))
    .orderBy(asc(candidateDocuments.sortOrder), asc(candidateDocuments.createdAt));
}

export async function getCandidateDocumentsByCategory(
  userId: string,
  category: string
) {
  return db
    .select()
    .from(candidateDocuments)
    .where(
      and(
        eq(candidateDocuments.userId, userId),
        eq(candidateDocuments.category, category)
      )
    )
    .orderBy(asc(candidateDocuments.sortOrder), asc(candidateDocuments.createdAt));
}

export async function createCandidateDocument(data: {
  userId: string;
  category: string;
  label: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}) {
  // Auto-increment sortOrder: get the current max + 1
  const [maxOrder] = await db
    .select({ max: sql<number>`COALESCE(MAX(${candidateDocuments.sortOrder}), -1)` })
    .from(candidateDocuments)
    .where(eq(candidateDocuments.userId, data.userId));

  const [doc] = await db
    .insert(candidateDocuments)
    .values({
      userId: data.userId,
      category: data.category,
      label: data.label,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    })
    .returning();

  return doc;
}

export async function updateCandidateDocument(
  id: string,
  userId: string,
  data: { label?: string; category?: string; sortOrder?: number }
) {
  const result = await db
    .update(candidateDocuments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(eq(candidateDocuments.id, id), eq(candidateDocuments.userId, userId))
    )
    .returning();

  return result[0] ?? null;
}

export async function deleteCandidateDocument(id: string, userId: string) {
  const result = await db
    .delete(candidateDocuments)
    .where(
      and(eq(candidateDocuments.id, id), eq(candidateDocuments.userId, userId))
    )
    .returning();

  return result[0] ?? null;
}

export async function reorderCandidateDocuments(
  userId: string,
  orderedIds: string[]
) {
  // Update sortOrder for each id based on its position in the array
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(candidateDocuments)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(
          and(
            eq(candidateDocuments.id, id),
            eq(candidateDocuments.userId, userId)
          )
        )
    )
  );
}

export async function countCandidateDocuments(userId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(candidateDocuments)
    .where(eq(candidateDocuments.userId, userId));

  return result?.total ?? 0;
}

// =============================================================================
// Candidate References Queries
// =============================================================================

export async function getCandidateReferences(userId: string) {
  return db
    .select()
    .from(candidateReferences)
    .where(eq(candidateReferences.userId, userId))
    .orderBy(asc(candidateReferences.sortOrder));
}

export async function createCandidateReference(data: {
  userId: string;
  fullName: string;
  jobTitle: string;
  company: string;
  phone?: string;
  email?: string;
  relationship?: string;
}) {
  // Auto-increment sortOrder: get the current max + 1
  const [maxOrder] = await db
    .select({ max: sql<number>`COALESCE(MAX(${candidateReferences.sortOrder}), -1)` })
    .from(candidateReferences)
    .where(eq(candidateReferences.userId, data.userId));

  const [ref] = await db
    .insert(candidateReferences)
    .values({
      userId: data.userId,
      fullName: data.fullName,
      jobTitle: data.jobTitle,
      company: data.company,
      phone: data.phone ?? null,
      email: data.email ?? null,
      relationship: data.relationship ?? null,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    })
    .returning();

  return ref;
}

export async function updateCandidateReference(
  id: string,
  userId: string,
  data: {
    fullName?: string;
    jobTitle?: string;
    company?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    sortOrder?: number;
  }
) {
  const result = await db
    .update(candidateReferences)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(candidateReferences.id, id),
        eq(candidateReferences.userId, userId)
      )
    )
    .returning();

  return result[0] ?? null;
}

export async function deleteCandidateReference(id: string, userId: string) {
  const result = await db
    .delete(candidateReferences)
    .where(
      and(
        eq(candidateReferences.id, id),
        eq(candidateReferences.userId, userId)
      )
    )
    .returning();

  return result[0] ?? null;
}

export async function reorderCandidateReferences(
  userId: string,
  orderedIds: string[]
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(candidateReferences)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(
          and(
            eq(candidateReferences.id, id),
            eq(candidateReferences.userId, userId)
          )
        )
    )
  );
}

export async function countCandidateReferences(userId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(candidateReferences)
    .where(eq(candidateReferences.userId, userId));

  return result?.total ?? 0;
}

// =============================================================================
// Application Queries
// =============================================================================

export async function createApplication(data: {
  userId: string;
  jobId?: string;
  cvAnalysisId?: string;
  jobTitle?: string;
  jobCompany?: string;
  jobDescription?: string;
  status?: string;
}) {
  const [app] = await db
    .insert(applications)
    .values({
      userId: data.userId,
      jobId: data.jobId ?? null,
      cvAnalysisId: data.cvAnalysisId ?? null,
      jobTitle: data.jobTitle ?? null,
      jobCompany: data.jobCompany ?? null,
      jobDescription: data.jobDescription ?? null,
      status: data.status ?? 'draft',
    })
    .onConflictDoUpdate({
      target: [applications.userId, applications.jobId],
      set: {
        cvAnalysisId: data.cvAnalysisId ?? null,
        jobTitle: data.jobTitle ?? null,
        jobCompany: data.jobCompany ?? null,
        jobDescription: data.jobDescription ?? null,
        status: data.status ?? 'draft',
        updatedAt: new Date(),
      },
    })
    .returning();

  return app;
}

export async function getApplicationById(id: string, userId: string) {
  const result = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);

  return result[0] ?? null;
}

export async function getApplicationsByUserId(
  userId: string,
  page = 1,
  limit = 20
) {
  const offset = (page - 1) * limit;

  const [countResult] = await db
    .select({ total: count() })
    .from(applications)
    .where(eq(applications.userId, userId));

  const results = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt))
    .limit(limit)
    .offset(offset);

  const total = countResult?.total ?? 0;

  return {
    applications: results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateApplication(
  id: string,
  userId: string,
  data: Partial<{
    cvAnalysisId: string | null;
    jobTitle: string | null;
    jobCompany: string | null;
    jobDescription: string | null;
    generatedCvUrl: string | null;
    generatedCvData: Record<string, unknown> | null;
    coverLetterUrl: string | null;
    coverLetterText: string | null;
    coverLetterInstructions: string | null;
    emailSubject: string | null;
    emailBody: string | null;
    referencesPageUrl: string | null;
    dossierUrl: string | null;
    dossierMode: string | null;
    status: string;
  }>
) {
  const result = await db
    .update(applications)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();

  return result[0] ?? null;
}

export async function deleteApplication(id: string, userId: string) {
  const result = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();

  return result[0] ?? null;
}

export async function countApplicationsByUser(userId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(applications)
    .where(eq(applications.userId, userId));

  return result?.total ?? 0;
}

// =============================================================================
// AI Generations Log Queries
// =============================================================================

export async function logAiGeneration(
  userId: string,
  type: string,
  applicationId: string,
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
) {
  const promptCost = (usage?.promptTokens || 0) * 2.50 / 1_000_000;
  const completionCost = (usage?.completionTokens || 0) * 10.00 / 1_000_000;
  const totalCost = promptCost + completionCost;

  const [entry] = await db
    .insert(aiGenerationsLog)
    .values({
      userId,
      type,
      applicationId,
      promptTokens: usage?.promptTokens || null,
      completionTokens: usage?.completionTokens || null,
      totalTokens: usage?.totalTokens || null,
      costUsd: totalCost > 0 ? totalCost.toFixed(6) : null,
    })
    .returning();

  return entry;
}

export async function countTodayGenerations(userId: string) {
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ total: count() })
    .from(aiGenerationsLog)
    .where(
      and(
        eq(aiGenerationsLog.userId, userId),
        gte(aiGenerationsLog.createdAt, todayMidnight)
      )
    );

  return result?.total ?? 0;
}

// =============================================================================
// User Photo Query
// =============================================================================

export async function updateUserPhoto(userId: string, photoUrl: string | null) {
  const [user] = await db
    .update(users)
    .set({
      photoUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

// =============================================================================
// Application Status Transition Queries
// =============================================================================

export async function transitionApplicationStatus(
  id: string,
  userId: string,
  toStatus: ApplicationStatus,
  triggeredBy: 'user' | 'system',
  note?: string
) {
  return db.transaction(async (tx) => {
    const [app] = await tx.execute(
      sql`SELECT * FROM applications WHERE id = ${id} AND user_id = ${userId} FOR UPDATE`
    );

    if (!app) {
      throw new Error('Application non trouvée');
    }

    const fromStatus = app.status as ApplicationStatus;

    if (fromStatus === toStatus) {
      throw new Error(`Transition invalide: le statut est déjà ${toStatus}`);
    }

    if (!isValidTransition(fromStatus, toStatus)) {
      throw new Error(`Transition invalide: ${fromStatus} → ${toStatus}`);
    }

    await tx.insert(applicationTransitions).values({
      applicationId: id,
      fromStatus,
      toStatus,
      triggeredBy,
      note: note ?? null,
    });

    const now = new Date();
    const nextFollowUp = computeNextFollowUpDate(
      toStatus,
      now,
      null,
      0
    );

    const [updated] = await tx
      .update(applications)
      .set({
        status: toStatus,
        lastStatusChangedAt: now,
        nextFollowUpAt: nextFollowUp,
        followUpCount: 0,
        updatedAt: now,
      })
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();

    return updated;
  });
}

export async function updateApplicationNotes(id: string, userId: string, notes: string) {
  const [updated] = await db
    .update(applications)
    .set({ notes, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();
  return updated;
}

export async function getApplicationTransitions(applicationId: string, userId: string) {
  const app = await getApplicationById(applicationId, userId);
  if (!app) return null;

  return db
    .select()
    .from(applicationTransitions)
    .where(eq(applicationTransitions.applicationId, applicationId))
    .orderBy(desc(applicationTransitions.createdAt));
}

export async function getApplicationsNeedingFollowUp(userId?: string) {
  const now = new Date();
  const actionableStatuses: ApplicationStatus[] = ['applied', 'screening', 'interview', 'offer'];

  const conditions = [
    lte(applications.nextFollowUpAt, now),
    inArray(applications.status, actionableStatuses),
  ];

  if (userId) {
    conditions.push(eq(applications.userId, userId));
  }

  return db
    .select({
      application: applications,
      userEmail: users.email,
      userId: users.id,
      userFullName: users.fullName,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(applications.nextFollowUpAt));
}

export async function updateLastReminderSentAt(applicationIds: string[]) {
  if (applicationIds.length === 0) return;
  await db
    .update(applications)
    .set({ lastReminderSentAt: new Date() })
    .where(inArray(applications.id, applicationIds));
}

export async function getApplicationsByUserWithUrgency(userId: string) {
  return db
    .select({
      application: applications,
      job: jobs,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.userId, userId))
    .orderBy(asc(applications.nextFollowUpAt), desc(applications.updatedAt));
}

// =============================================================================
// Interview Prep Queries
// =============================================================================

export async function getApplicationWithContext(id: string, userId: string) {
  const app = await getApplicationById(id, userId);
  if (!app) return null;

  const cvAnalysis = app.cvAnalysisId
    ? await getCvAnalysisById(app.cvAnalysisId)
    : null;

  const job = app.jobId ? await getJobById(app.jobId) : null;

  let cachedMatch = null;
  if (app.cvAnalysisId && app.jobId) {
    cachedMatch = await getJobMatch(app.cvAnalysisId, app.jobId);
  }

  return { application: app, cvAnalysis, job, cachedMatch };
}

export async function saveInterviewPrep(
  id: string,
  userId: string,
  prep: InterviewPrepData
) {
  const result = await db
    .update(applications)
    .set({
      interviewPrep: prep as unknown as Record<string, unknown>,
      interviewPrepGeneratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();

  return result[0] ?? null;
}

// =============================================================================
// Email Status
// =============================================================================

export async function updateApplicationEmailStatus(
  id: string,
  userId: string,
  status: 'pending' | 'sent' | 'failed',
  to?: string,
  attempts?: number
) {
  const set: Record<string, unknown> = {
    emailSendStatus: status,
    updatedAt: new Date(),
  };
  if (status === 'sent') set.emailSentAt = new Date();
  if (to) set.emailSentTo = to;
  if (attempts !== undefined) set.emailSendAttempts = attempts;

  const [updated] = await db
    .update(applications)
    .set(set)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();
  return updated;
}

// =============================================================================
// Analytics Queries
// =============================================================================

export async function getApplicationStatusFunnel(userId: string) {
  const result = await db.execute(sql`
    SELECT status, COUNT(*)::int AS count
    FROM applications
    WHERE user_id = ${userId}
    GROUP BY status
    ORDER BY CASE status
      WHEN 'draft' THEN 1
      WHEN 'applied' THEN 2
      WHEN 'screening' THEN 3
      WHEN 'interview' THEN 4
      WHEN 'offer' THEN 5
      WHEN 'accepted' THEN 6
      WHEN 'rejected' THEN 7
      WHEN 'withdrawn' THEN 8
    END
  `);
  return result as unknown as { status: string; count: number }[];
}

export async function getApplicationsByCanton(userId: string) {
  const result = await db.execute(sql`
    SELECT
      j.canton,
      COUNT(*)::int AS count,
      AVG(jm.overall_score)::int AS "avgScore"
    FROM applications a
    INNER JOIN jobs j ON a.job_id = j.id
    LEFT JOIN job_matches jm ON jm.job_id = j.id AND jm.user_id = a.user_id
    WHERE a.user_id = ${userId}
      AND a.job_id IS NOT NULL
    GROUP BY j.canton
    ORDER BY count DESC
  `);
  return result as unknown as { canton: string; count: number; avgScore: number | null }[];
}

export async function getApplicationsByContractType(userId: string) {
  const result = await db.execute(sql`
    SELECT
      COALESCE(j.contract_type, 'Non spécifié') AS "contractType",
      COUNT(*)::int AS count
    FROM applications a
    INNER JOIN jobs j ON a.job_id = j.id
    WHERE a.user_id = ${userId}
      AND a.job_id IS NOT NULL
    GROUP BY j.contract_type
    ORDER BY count DESC
  `);
  return result as unknown as { contractType: string; count: number }[];
}

export async function getApplicationWeeklyTrend(userId: string, weeks = 12) {
  const result = await db.execute(sql`
    SELECT
      date_trunc('week', a.created_at)::text AS week,
      COUNT(*)::int AS count
    FROM applications a
    WHERE a.user_id = ${userId}
      AND a.created_at >= NOW() - make_interval(weeks => ${weeks})
    GROUP BY date_trunc('week', a.created_at)
    ORDER BY week ASC
  `);
  return result as unknown as { week: string; count: number }[];
}

export async function getTopSkillGaps(userId: string, limit = 10) {
  const result = await db.execute(sql`
    SELECT
      req->>'requirement' AS skill,
      COUNT(*)::int AS frequency
    FROM job_matches jm,
      jsonb_array_elements(jm.requirements->'blocks'->'b'->'requirements') AS req
    WHERE jm.user_id = ${userId}
      AND jm.requirements->>'matchVersion' = '2'
      AND req->>'status' = 'not_met'
    GROUP BY req->>'requirement'
    ORDER BY frequency DESC
    LIMIT ${limit}
  `);
  return result as unknown as { skill: string; frequency: number }[];
}

export async function getConversionStats(userId: string) {
  const result = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'applied')::int AS applied,
      COUNT(*) FILTER (WHERE status = 'screening')::int AS screening,
      COUNT(*) FILTER (WHERE status = 'interview')::int AS interviews,
      COUNT(*) FILTER (WHERE status = 'offer')::int AS offers,
      COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
    FROM applications
    WHERE user_id = ${userId}
  `);
  const row = (result as unknown as Record<string, number>[])[0];
  return {
    total: row?.total ?? 0,
    applied: row?.applied ?? 0,
    screening: row?.screening ?? 0,
    interviews: row?.interviews ?? 0,
    offers: row?.offers ?? 0,
    accepted: row?.accepted ?? 0,
    rejected: row?.rejected ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Dashboard intelligence queries (M002/S02)
// ---------------------------------------------------------------------------

export async function getTopMatchesForUser(
  userId: string,
  activeCvAnalysisId: string
): Promise<
  {
    overallScore: number;
    verdict: string;
    title: string;
    company: string;
    canton: string;
    sourceUrl: string;
    jobId: string;
  }[]
> {
  const result = await db.execute(sql`
    SELECT
      jm.overall_score AS "overallScore",
      jm.verdict,
      j.title,
      j.company,
      j.canton,
      j.source_url AS "sourceUrl",
      j.id AS "jobId"
    FROM job_matches jm
    JOIN jobs j ON j.id = jm.job_id
    WHERE jm.user_id = ${userId}
      AND jm.cv_analysis_id = ${activeCvAnalysisId}
      AND j.status = 'active'
    ORDER BY jm.overall_score DESC
    LIMIT 5
  `);
  return result as unknown as {
    overallScore: number;
    verdict: string;
    title: string;
    company: string;
    canton: string;
    sourceUrl: string;
    jobId: string;
  }[];
}

export async function getDailyApplicationStats(
  userId: string
): Promise<{ todayCount: number; streak: number }> {
  const result = await db.execute(sql`
    WITH daily_counts AS (
      SELECT
        (a.created_at AT TIME ZONE 'Europe/Zurich')::date AS app_date,
        COUNT(*)::int AS cnt
      FROM applications a
      WHERE a.user_id = ${userId}
      GROUP BY (a.created_at AT TIME ZONE 'Europe/Zurich')::date
    ),
    today_count AS (
      SELECT COALESCE(
        (SELECT cnt FROM daily_counts WHERE app_date = (NOW() AT TIME ZONE 'Europe/Zurich')::date),
        0
      ) AS today
    ),
    streak_calc AS (
      SELECT
        app_date,
        app_date - (ROW_NUMBER() OVER (ORDER BY app_date DESC))::int AS grp
      FROM daily_counts
      WHERE cnt >= 5
        AND app_date <= (NOW() AT TIME ZONE 'Europe/Zurich')::date
    ),
    streak_result AS (
      SELECT COUNT(*)::int AS streak
      FROM streak_calc
      WHERE grp = (
        SELECT grp FROM streak_calc
        WHERE app_date = (NOW() AT TIME ZONE 'Europe/Zurich')::date
        LIMIT 1
      )
    )
    SELECT
      (SELECT today FROM today_count) AS "todayCount",
      COALESCE((SELECT streak FROM streak_result), 0)::int AS streak
  `);
  const row = (result as unknown as { todayCount: number; streak: number }[])[0];
  return {
    todayCount: row?.todayCount ?? 0,
    streak: row?.streak ?? 0,
  };
}

export async function getEmployabilityScoreData(
  userId: string
): Promise<{ recentApplicationsCount: number }> {
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS "recentApplicationsCount"
    FROM applications
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '30 days'
  `);
  const row = (result as unknown as { recentApplicationsCount: number }[])[0];
  return {
    recentApplicationsCount: row?.recentApplicationsCount ?? 0,
  };
}

// =============================================================================
// LinkedIn Queries
// =============================================================================

export async function getLinkedinProfile(userId: string) {
  const result = await db
    .select()
    .from(linkedinProfiles)
    .where(eq(linkedinProfiles.userId, userId))
    .limit(1);

  return result[0] ?? null;
}

export async function upsertLinkedinProfile(data: {
  userId: string;
  source: string;
  rawText?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  structured: Record<string, unknown>;
  headline?: string | null;
  summary?: string | null;
}) {
  const [profile] = await db
    .insert(linkedinProfiles)
    .values({
      userId: data.userId,
      source: data.source,
      rawText: data.rawText ?? null,
      fileUrl: data.fileUrl ?? null,
      fileName: data.fileName ?? null,
      structured: data.structured,
      headline: data.headline ?? null,
      summary: data.summary ?? null,
    })
    .onConflictDoUpdate({
      target: linkedinProfiles.userId,
      set: {
        source: data.source,
        rawText: data.rawText ?? null,
        fileUrl: data.fileUrl ?? null,
        fileName: data.fileName ?? null,
        structured: data.structured,
        headline: data.headline ?? null,
        summary: data.summary ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return profile;
}

export async function updateLinkedinAudit(
  userId: string,
  auditScore: number,
  auditResult: Record<string, unknown>
) {
  const result = await db
    .update(linkedinProfiles)
    .set({
      auditScore,
      auditResult,
      updatedAt: new Date(),
    })
    .where(eq(linkedinProfiles.userId, userId))
    .returning();

  return result[0] ?? null;
}

export async function updateLinkedinOptimized(
  userId: string,
  headline: string,
  summary: string
) {
  const result = await db
    .update(linkedinProfiles)
    .set({
      optimizedHeadline: headline,
      optimizedSummary: summary,
      updatedAt: new Date(),
    })
    .where(eq(linkedinProfiles.userId, userId))
    .returning();

  return result[0] ?? null;
}

export async function getLinkedinPosts(userId: string, batch?: string) {
  const conditions = [eq(linkedinPosts.userId, userId)];
  if (batch) {
    conditions.push(eq(linkedinPosts.generationBatch, batch));
  }

  return db
    .select()
    .from(linkedinPosts)
    .where(and(...conditions))
    .orderBy(asc(linkedinPosts.weekNumber), asc(linkedinPosts.sortOrder));
}

export async function createLinkedinPosts(
  posts: {
    userId: string;
    profileId: string;
    weekNumber: number;
    dayOfWeek: string;
    contentType: string;
    title: string;
    draftContent: string;
    generationBatch: string;
    sortOrder?: number;
  }[]
) {
  if (posts.length === 0) return [];

  return db
    .insert(linkedinPosts)
    .values(
      posts.map((p, i) => ({
        userId: p.userId,
        profileId: p.profileId,
        weekNumber: p.weekNumber,
        dayOfWeek: p.dayOfWeek,
        contentType: p.contentType,
        title: p.title,
        draftContent: p.draftContent,
        generationBatch: p.generationBatch,
        sortOrder: p.sortOrder ?? i,
      }))
    )
    .returning();
}

export async function updateLinkedinPostContent(
  postId: string,
  userId: string,
  userContent: string
) {
  const result = await db
    .update(linkedinPosts)
    .set({
      userContent,
      updatedAt: new Date(),
    })
    .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, userId)))
    .returning();

  return result[0] ?? null;
}

export async function getLatestPostBatch(userId: string) {
  const result = await db
    .select({ generationBatch: linkedinPosts.generationBatch })
    .from(linkedinPosts)
    .where(eq(linkedinPosts.userId, userId))
    .orderBy(desc(linkedinPosts.createdAt))
    .limit(1);

  return result[0]?.generationBatch ?? null;
}

// =============================================================================
// Saved Searches Queries
// =============================================================================

export async function getSavedSearches(userId: string) {
  return db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
}

export async function createSavedSearch(
  userId: string,
  name: string,
  filters: Record<string, unknown>
) {
  const [search] = await db
    .insert(savedSearches)
    .values({ userId, name, filters })
    .returning();
  return search;
}

export async function updateSavedSearch(
  id: string,
  userId: string,
  data: {
    name?: string;
    filters?: Record<string, unknown>;
    emailAlertEnabled?: boolean;
  }
) {
  const [updated] = await db
    .update(savedSearches)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)))
    .returning();
  return updated;
}

export async function deleteSavedSearch(id: string, userId: string) {
  const [deleted] = await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)))
    .returning();
  return deleted;
}

export async function getSavedSearchesWithAlerts() {
  return db
    .select({
      id: savedSearches.id,
      userId: savedSearches.userId,
      name: savedSearches.name,
      filters: savedSearches.filters,
      emailAlertEnabled: savedSearches.emailAlertEnabled,
      lastAlertAt: savedSearches.lastAlertAt,
      lastAlertJobCount: savedSearches.lastAlertJobCount,
      createdAt: savedSearches.createdAt,
      updatedAt: savedSearches.updatedAt,
      userEmail: users.email,
      userFullName: users.fullName,
    })
    .from(savedSearches)
    .innerJoin(users, eq(savedSearches.userId, users.id))
    .where(eq(savedSearches.emailAlertEnabled, true));
}

export async function updateSavedSearchAlertState(id: string, jobCount: number) {
  const [updated] = await db
    .update(savedSearches)
    .set({ lastAlertAt: new Date(), lastAlertJobCount: jobCount, updatedAt: new Date() })
    .where(eq(savedSearches.id, id))
    .returning();
  return updated;
}
