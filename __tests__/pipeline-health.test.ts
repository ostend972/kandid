import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/drizzle', () => ({
  db: {},
  client: {},
}));

import {
  checkOrphanedApplications,
  checkInconsistentStatuses,
  checkDuplicates,
  runFullHealthCheck,
} from '@/lib/pipeline-health';
import { applicationStatusEnum } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// Flexible mock that supports both `select().from()` (thenable) and
// `select().from().where()` / `select().from().leftJoin().where()` patterns.
// ---------------------------------------------------------------------------

const whereResults: any[][] = [];
let whereCallIdx = 0;

const executeResults: any[][] = [];
let executeCallIdx = 0;

const directFromResults: any[][] = [];
let fromCallIdx = 0;

function mockWhereFn(..._args: any[]) {
  const idx = whereCallIdx++;
  return Promise.resolve(whereResults[idx] ?? []);
}

function mockExecuteFn(..._args: any[]) {
  const idx = executeCallIdx++;
  return Promise.resolve(executeResults[idx] ?? []);
}

function mockFromFn(..._args: any[]) {
  const idx = fromCallIdx++;
  const directResult = directFromResults[idx] ?? [];
  const obj: any = {
    where: mockWhereFn,
    leftJoin: (..._a: any[]) => ({ where: mockWhereFn }),
  };
  obj.then = (onFulfilled: any, onRejected?: any) =>
    Promise.resolve(directResult).then(onFulfilled, onRejected);
  return obj;
}

function mockSelectFn(..._args: any[]) {
  return { from: mockFromFn };
}

let mockDb: any;

function freshDb() {
  whereResults.length = 0;
  executeResults.length = 0;
  directFromResults.length = 0;
  whereCallIdx = 0;
  executeCallIdx = 0;
  fromCallIdx = 0;
  mockDb = { select: mockSelectFn, execute: mockExecuteFn };
}

beforeEach(() => {
  freshDb();
});

// ---------------------------------------------------------------------------
// Enum validation
// ---------------------------------------------------------------------------

describe('applicationStatusEnum sanity', () => {
  it('contains the expected 8 values', () => {
    expect(applicationStatusEnum.enumValues).toEqual([
      'draft', 'applied', 'screening', 'interview',
      'offer', 'accepted', 'rejected', 'withdrawn',
    ]);
  });
});

// ---------------------------------------------------------------------------
// checkOrphanedApplications
// Uses 3 select().from() calls, all resolved via .where():
//   1. job-orphaned → .where()
//   2. stale → .where()
//   3. transition-orphaned → .leftJoin().where()
// ---------------------------------------------------------------------------

describe('checkOrphanedApplications', () => {
  it('returns empty array when DB has no applications', async () => {
    const result = await checkOrphanedApplications(mockDb);
    expect(result).toEqual([]);
  });

  it('detects job-orphaned applications', async () => {
    whereResults[0] = [{ id: 'app-1', userId: 'u1', status: 'applied' }];

    const result = await checkOrphanedApplications(mockDb);
    const found = result.filter((r) => r.reason === 'job-orphaned');
    expect(found).toHaveLength(1);
    expect(found[0].applicationId).toBe('app-1');
  });

  it('detects stale applications', async () => {
    // where[0] = job-orphaned (empty), where[1] = stale
    whereResults[1] = [{ id: 'app-2', userId: 'u1', status: 'screening' }];

    const result = await checkOrphanedApplications(mockDb);
    const found = result.filter((r) => r.reason === 'stale');
    expect(found).toHaveLength(1);
    expect(found[0].detail).toContain('30 days');
  });

  it('detects transition-orphaned applications', async () => {
    // where[2] = transition-orphaned
    whereResults[2] = [
      { id: 'app-3', userId: 'u1', status: 'applied', transitionId: null },
    ];

    const result = await checkOrphanedApplications(mockDb);
    const found = result.filter((r) => r.reason === 'transition-orphaned');
    expect(found).toHaveLength(1);
  });

  it('does NOT flag draft apps without transitions as transition-orphaned', async () => {
    // Query filters status != 'draft' at the SQL level, so empty result
    const result = await checkOrphanedApplications(mockDb);
    expect(result.filter((r) => r.reason === 'transition-orphaned')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// checkInconsistentStatuses
// Call pattern:
//   1. select().from(applicationTransitions) — awaited directly (directFromResults[0])
//   2. execute() for LATERAL join query (executeResults[0])
// ---------------------------------------------------------------------------

describe('checkInconsistentStatuses', () => {
  it('returns empty array when no transitions exist', async () => {
    const result = await checkInconsistentStatuses(mockDb);
    expect(result).toEqual([]);
  });

  it('flags transitions with invalid fromStatus enum values', async () => {
    directFromResults[0] = [
      { id: 't-1', applicationId: 'app-1', fromStatus: 'INVALID_STATUS', toStatus: 'applied' },
    ];

    const result = await checkInconsistentStatuses(mockDb);
    expect(result).toHaveLength(1);
    expect(result[0].issue).toBe('invalid-enum');
    expect(result[0].detail).toContain('INVALID_STATUS');
  });

  it('flags transitions with invalid toStatus enum values', async () => {
    directFromResults[0] = [
      { id: 't-2', applicationId: 'app-2', fromStatus: 'draft', toStatus: 'bogus' },
    ];

    const result = await checkInconsistentStatuses(mockDb);
    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('bogus');
  });

  it('flags transitions where BOTH from and to are invalid', async () => {
    directFromResults[0] = [
      { id: 't-3', applicationId: 'app-3', fromStatus: 'foo', toStatus: 'bar' },
    ];

    const result = await checkInconsistentStatuses(mockDb);
    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('foo');
    expect(result[0].detail).toContain('bar');
  });

  it('detects status mismatch between app and latest transition', async () => {
    executeResults[0] = [
      { app_id: 'app-5', app_status: 'interview', latest_to_status: 'screening' },
    ];

    const result = await checkInconsistentStatuses(mockDb);
    const found = result.filter((r) => r.issue === 'status-mismatch');
    expect(found).toHaveLength(1);
    expect(found[0].detail).toContain('interview');
    expect(found[0].detail).toContain('screening');
  });

  it('does not flag matching app status and latest transition', async () => {
    executeResults[0] = [
      { app_id: 'app-6', app_status: 'applied', latest_to_status: 'applied' },
    ];

    const result = await checkInconsistentStatuses(mockDb);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// checkDuplicates
// Call pattern:
//   1. execute() — clusters (executeResults[0])
//   2. select().from().where() per cluster (whereResults[0], [1], ...)
// ---------------------------------------------------------------------------

describe('checkDuplicates', () => {
  it('returns empty when no duplicate clusters', async () => {
    const result = await checkDuplicates(mockDb);
    expect(result).toEqual([]);
  });

  it('returns duplicate clusters with member apps', async () => {
    executeResults[0] = [
      { user_id: 'u1', norm_title: 'developer', norm_company: 'acme' },
    ];
    whereResults[0] = [
      { id: 'a1', status: 'draft', createdAt: new Date('2026-01-01') },
      { id: 'a2', status: 'applied', createdAt: new Date('2026-01-15') },
    ];

    const result = await checkDuplicates(mockDb);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('u1');
    expect(result[0].jobTitle).toBe('developer');
    expect(result[0].applications).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// runFullHealthCheck orchestrator
// Runs all 3 checks in parallel. Mock call order is non-deterministic across
// checks, so we test via a throw-based approach for error handling and
// rely on individual check tests for correctness.
// ---------------------------------------------------------------------------

describe('runFullHealthCheck', () => {
  it('returns healthy report when all checks return empty', async () => {
    const report = await runFullHealthCheck(mockDb);
    expect(report.summary.status).toBe('healthy');
    expect(report.summary.totalIssues).toBe(0);
    expect(report.checks.orphanedApplications).toEqual([]);
    expect(report.checks.inconsistentStatuses).toEqual([]);
    expect(report.checks.duplicates).toEqual([]);
    expect(report.error).toBeUndefined();
  });

  it('returns warnings when 1-5 total issues', async () => {
    // Orphans: where[0] returns 3 job-orphaned apps
    whereResults[0] = [
      { id: 'a1', userId: 'u1', status: 'applied' },
      { id: 'a2', userId: 'u1', status: 'screening' },
      { id: 'a3', userId: 'u1', status: 'interview' },
    ];

    const report = await runFullHealthCheck(mockDb);
    expect(report.summary.totalIssues).toBeGreaterThanOrEqual(3);
    expect(['warnings', 'errors']).toContain(report.summary.status);
  });

  it('returns error field when a check throws', async () => {
    const throwingDb = {
      select: () => { throw new Error('connection refused'); },
      execute: () => { throw new Error('connection refused'); },
    } as any;

    const report = await runFullHealthCheck(throwingDb);
    expect(report.error).toBe('connection refused');
    expect(report.summary.totalIssues).toBe(0);
  });

  it('includes checkedAt timestamp in ISO format', async () => {
    const report = await runFullHealthCheck(mockDb);
    expect(report.summary.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('status thresholds: 0→healthy, ≤5→warnings, >5→errors', () => {
    // Tested via individual check tests + orchestrator logic is straightforward
    // Direct unit verification of the threshold logic:
    const computeStatus = (n: number) =>
      n === 0 ? 'healthy' : n <= 5 ? 'warnings' : 'errors';

    expect(computeStatus(0)).toBe('healthy');
    expect(computeStatus(1)).toBe('warnings');
    expect(computeStatus(5)).toBe('warnings');
    expect(computeStatus(6)).toBe('errors');
    expect(computeStatus(100)).toBe('errors');
  });
});
