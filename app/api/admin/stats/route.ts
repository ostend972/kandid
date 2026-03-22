import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  users,
  cvAnalyses,
  applications,
  jobs,
  aiGenerationsLog,
  jobMatches,
  savedJobs,
  candidateDocuments,
} from '@/lib/db/schema';
import { count, avg, eq, gte, sql, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // include today = 7 days

  // ---------------------------------------------------------------------------
  // KPI counts
  // ---------------------------------------------------------------------------
  const [
    [{ value: usersCount }],
    [{ value: cvAnalysesCount }],
    [{ value: applicationsCount }],
    [{ value: activeJobsCount }],
    [{ value: expiredJobsCount }],
    [{ value: aiGenerationsTodayCount }],
    [{ value: jobMatchesCount }],
    [{ value: savedJobsCount }],
    [{ value: candidateDocumentsCount }],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(cvAnalyses),
    db.select({ value: count() }).from(applications),
    db.select({ value: count() }).from(jobs).where(eq(jobs.status, 'active')),
    db.select({ value: count() }).from(jobs).where(eq(jobs.status, 'expired')),
    db
      .select({ value: count() })
      .from(aiGenerationsLog)
      .where(gte(aiGenerationsLog.createdAt, today)),
    db.select({ value: count() }).from(jobMatches),
    db.select({ value: count() }).from(savedJobs),
    db.select({ value: count() }).from(candidateDocuments),
  ]);

  // ---------------------------------------------------------------------------
  // Averages
  // ---------------------------------------------------------------------------
  const [
    [{ value: avgCvScore }],
    [{ value: avgMatchScore }],
    [{ value: completedApplicationsCount }],
  ] = await Promise.all([
    db.select({ value: avg(cvAnalyses.overallScore) }).from(cvAnalyses),
    db.select({ value: avg(jobMatches.overallScore) }).from(jobMatches),
    db
      .select({ value: count() })
      .from(applications)
      .where(eq(applications.status, 'completed')),
  ]);

  // ---------------------------------------------------------------------------
  // API costs & tokens
  // ---------------------------------------------------------------------------
  const [
    [{ value: totalCostValue }],
    [{ value: totalTokensValue }],
    [{ value: todayCostValue }],
    [{ value: todayTokensValue }],
  ] = await Promise.all([
    db.select({ value: sql<string>`COALESCE(SUM(CAST(${aiGenerationsLog.costUsd} AS DECIMAL)), 0)` }).from(aiGenerationsLog),
    db.select({ value: sql<number>`COALESCE(SUM(${aiGenerationsLog.totalTokens}), 0)` }).from(aiGenerationsLog),
    db.select({ value: sql<string>`COALESCE(SUM(CAST(${aiGenerationsLog.costUsd} AS DECIMAL)), 0)` }).from(aiGenerationsLog).where(gte(aiGenerationsLog.createdAt, today)),
    db.select({ value: sql<number>`COALESCE(SUM(${aiGenerationsLog.totalTokens}), 0)` }).from(aiGenerationsLog).where(gte(aiGenerationsLog.createdAt, today)),
  ]);

  const completionRate =
    applicationsCount > 0
      ? Math.round((completedApplicationsCount / applicationsCount) * 100)
      : 0;

  // ---------------------------------------------------------------------------
  // Chart: signups per day (last 7 days)
  // ---------------------------------------------------------------------------
  const signupsPerDay = await db
    .select({
      date: sql<string>`DATE(${users.createdAt})`.as('date'),
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);

  // ---------------------------------------------------------------------------
  // Chart: jobs by canton (top 10, active only)
  // ---------------------------------------------------------------------------
  const jobsByCanton = await db
    .select({
      canton: jobs.canton,
      count: count(),
    })
    .from(jobs)
    .where(eq(jobs.status, 'active'))
    .groupBy(jobs.canton)
    .orderBy(desc(count()))
    .limit(10);

  // ---------------------------------------------------------------------------
  // Response
  // ---------------------------------------------------------------------------
  return NextResponse.json({
    kpi: {
      users: usersCount,
      cvAnalyses: cvAnalysesCount,
      applications: applicationsCount,
      activeJobs: activeJobsCount,
      expiredJobs: expiredJobsCount,
      aiGenerationsToday: aiGenerationsTodayCount,
      jobMatches: jobMatchesCount,
      savedJobs: savedJobsCount,
      candidateDocuments: candidateDocumentsCount,
    },
    averages: {
      avgCvScore: avgCvScore ? Math.round(Number(avgCvScore)) : null,
      avgMatchScore: avgMatchScore ? Math.round(Number(avgMatchScore)) : null,
      completedApplications: completedApplicationsCount,
      completionRate,
    },
    api: {
      totalCost: Number(totalCostValue) || 0,
      totalTokens: Number(totalTokensValue) || 0,
      todayCost: Number(todayCostValue) || 0,
      todayTokens: Number(todayTokensValue) || 0,
    },
    charts: {
      signupsPerDay,
      jobsByCanton,
    },
  });
}
