import { db } from '@/lib/db/drizzle';
import {
  applications,
  applicationTransitions,
  applicationStatusEnum,
} from '@/lib/db/schema';
import { eq, sql, and, notInArray, isNull, isNotNull, lt } from 'drizzle-orm';

const VALID_STATUSES = applicationStatusEnum.enumValues;
const TERMINAL_STATUSES = ['accepted', 'rejected', 'withdrawn'] as const;
const STALE_THRESHOLD_DAYS = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrphanedApplication {
  applicationId: string;
  userId: string;
  status: string;
  reason: 'job-orphaned' | 'stale' | 'transition-orphaned';
  detail: string;
}

export interface InconsistentStatus {
  applicationId: string;
  transitionId?: string;
  issue: 'invalid-enum' | 'status-mismatch';
  detail: string;
}

export interface DuplicateCluster {
  userId: string;
  jobTitle: string;
  jobCompany: string;
  applications: { id: string; status: string; createdAt: Date | null }[];
}

export interface PipelineHealthReport {
  checks: {
    orphanedApplications: OrphanedApplication[];
    inconsistentStatuses: InconsistentStatus[];
    duplicates: DuplicateCluster[];
  };
  summary: {
    totalIssues: number;
    status: 'healthy' | 'warnings' | 'errors';
    checkedAt: string;
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// Check functions
// ---------------------------------------------------------------------------

export async function checkOrphanedApplications(
  database: typeof db = db,
): Promise<OrphanedApplication[]> {
  const results: OrphanedApplication[] = [];

  const jobOrphaned = await database
    .select({
      id: applications.id,
      userId: applications.userId,
      status: applications.status,
    })
    .from(applications)
    .where(
      and(
        isNull(applications.jobId),
        notInArray(applications.status, [...TERMINAL_STATUSES]),
      ),
    );

  for (const app of jobOrphaned) {
    results.push({
      applicationId: app.id,
      userId: app.userId,
      status: app.status,
      reason: 'job-orphaned',
      detail: 'Non-terminal application with no linked job',
    });
  }

  const cutoff = sql`NOW() - INTERVAL '${sql.raw(String(STALE_THRESHOLD_DAYS))} days'`;
  const stale = await database
    .select({
      id: applications.id,
      userId: applications.userId,
      status: applications.status,
    })
    .from(applications)
    .where(
      and(
        notInArray(applications.status, [...TERMINAL_STATUSES]),
        lt(
          sql`COALESCE(${applications.lastStatusChangedAt}, ${applications.createdAt})`,
          cutoff,
        ),
      ),
    );

  for (const app of stale) {
    results.push({
      applicationId: app.id,
      userId: app.userId,
      status: app.status,
      reason: 'stale',
      detail: `No status change in over ${STALE_THRESHOLD_DAYS} days`,
    });
  }

  const transitionOrphaned = await database
    .select({
      id: applications.id,
      userId: applications.userId,
      status: applications.status,
      transitionId: applicationTransitions.id,
    })
    .from(applications)
    .leftJoin(
      applicationTransitions,
      eq(applications.id, applicationTransitions.applicationId),
    )
    .where(
      and(
        isNull(applicationTransitions.id),
        sql`${applications.status} != 'draft'`,
      ),
    );

  for (const app of transitionOrphaned) {
    results.push({
      applicationId: app.id,
      userId: app.userId,
      status: app.status,
      reason: 'transition-orphaned',
      detail: 'Application left draft but has no transition history',
    });
  }

  return results;
}

export async function checkInconsistentStatuses(
  database: typeof db = db,
): Promise<InconsistentStatus[]> {
  const results: InconsistentStatus[] = [];

  const allTransitions = await database
    .select({
      id: applicationTransitions.id,
      applicationId: applicationTransitions.applicationId,
      fromStatus: applicationTransitions.fromStatus,
      toStatus: applicationTransitions.toStatus,
    })
    .from(applicationTransitions);

  for (const t of allTransitions) {
    const issues: string[] = [];
    if (!VALID_STATUSES.includes(t.fromStatus as any)) {
      issues.push(`fromStatus '${t.fromStatus}' is not a valid enum value`);
    }
    if (!VALID_STATUSES.includes(t.toStatus as any)) {
      issues.push(`toStatus '${t.toStatus}' is not a valid enum value`);
    }
    if (issues.length > 0) {
      results.push({
        applicationId: t.applicationId,
        transitionId: t.id,
        issue: 'invalid-enum',
        detail: issues.join('; '),
      });
    }
  }

  const appsWithLatestTransition = await database.execute<{
    app_id: string;
    app_status: string;
    latest_to_status: string;
  }>(sql`
    SELECT
      a.id AS app_id,
      a.status AS app_status,
      t.to_status AS latest_to_status
    FROM applications a
    INNER JOIN LATERAL (
      SELECT at2.to_status
      FROM application_transitions at2
      WHERE at2.application_id = a.id
      ORDER BY at2.created_at DESC
      LIMIT 1
    ) t ON true
  `);

  for (const row of appsWithLatestTransition) {
    if (row.app_status !== row.latest_to_status) {
      results.push({
        applicationId: row.app_id,
        issue: 'status-mismatch',
        detail: `Application status '${row.app_status}' does not match latest transition toStatus '${row.latest_to_status}'`,
      });
    }
  }

  return results;
}

export async function checkDuplicates(
  database: typeof db = db,
): Promise<DuplicateCluster[]> {
  const clusters = await database.execute<{
    user_id: string;
    norm_title: string;
    norm_company: string;
  }>(sql`
    SELECT
      user_id,
      LOWER(TRIM(job_title)) AS norm_title,
      LOWER(TRIM(job_company)) AS norm_company
    FROM applications
    WHERE job_title IS NOT NULL AND job_company IS NOT NULL
    GROUP BY user_id, LOWER(TRIM(job_title)), LOWER(TRIM(job_company))
    HAVING COUNT(*) > 1
  `);

  const results: DuplicateCluster[] = [];

  for (const cluster of clusters) {
    const apps = await database
      .select({
        id: applications.id,
        status: applications.status,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .where(
        and(
          eq(applications.userId, cluster.user_id),
          sql`LOWER(TRIM(${applications.jobTitle})) = ${cluster.norm_title}`,
          sql`LOWER(TRIM(${applications.jobCompany})) = ${cluster.norm_company}`,
        ),
      );

    results.push({
      userId: cluster.user_id,
      jobTitle: cluster.norm_title,
      jobCompany: cluster.norm_company,
      applications: apps.map((a) => ({
        id: a.id,
        status: a.status,
        createdAt: a.createdAt,
      })),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function runFullHealthCheck(
  database: typeof db = db,
): Promise<PipelineHealthReport> {
  try {
    const [orphanedApplications, inconsistentStatuses, duplicates] =
      await Promise.all([
        checkOrphanedApplications(database),
        checkInconsistentStatuses(database),
        checkDuplicates(database),
      ]);

    const totalIssues =
      orphanedApplications.length +
      inconsistentStatuses.length +
      duplicates.length;

    let status: 'healthy' | 'warnings' | 'errors';
    if (totalIssues === 0) status = 'healthy';
    else if (totalIssues <= 5) status = 'warnings';
    else status = 'errors';

    return {
      checks: { orphanedApplications, inconsistentStatuses, duplicates },
      summary: {
        totalIssues,
        status,
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      checks: {
        orphanedApplications: [],
        inconsistentStatuses: [],
        duplicates: [],
      },
      summary: {
        totalIssues: 0,
        status: 'healthy',
        checkedAt: new Date().toISOString(),
      },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
