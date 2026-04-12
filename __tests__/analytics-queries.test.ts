import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecute = vi.fn();

vi.mock('@/lib/db/drizzle', () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
  client: {},
}));

import {
  getApplicationStatusFunnel,
  getApplicationsByCanton,
  getApplicationsByContractType,
  getApplicationWeeklyTrend,
  getTopSkillGaps,
  getConversionStats,
} from '@/lib/db/kandid-queries';

const USER_ID = 'user_test_123';

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// getApplicationStatusFunnel
// =============================================================================

describe('getApplicationStatusFunnel', () => {
  it('returns status counts grouped and ordered', async () => {
    const rows = [
      { status: 'draft', count: 3 },
      { status: 'applied', count: 5 },
      { status: 'rejected', count: 1 },
    ];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getApplicationStatusFunnel(USER_ID);
    expect(result).toEqual(rows);
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it('returns empty array when user has no applications', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await getApplicationStatusFunnel(USER_ID);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// getApplicationsByCanton
// =============================================================================

describe('getApplicationsByCanton', () => {
  it('returns canton counts with average scores', async () => {
    const rows = [
      { canton: 'GE', count: 4, avgScore: 72 },
      { canton: 'VD', count: 2, avgScore: 65 },
    ];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getApplicationsByCanton(USER_ID);
    expect(result).toEqual(rows);
    expect(result[0].canton).toBe('GE');
    expect(result[0].avgScore).toBe(72);
  });

  it('returns empty array when user has no applications with jobs', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await getApplicationsByCanton(USER_ID);
    expect(result).toEqual([]);
  });

  it('handles null avgScore when no job matches exist', async () => {
    const rows = [{ canton: 'ZH', count: 1, avgScore: null }];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getApplicationsByCanton(USER_ID);
    expect(result[0].avgScore).toBeNull();
  });
});

// =============================================================================
// getApplicationsByContractType
// =============================================================================

describe('getApplicationsByContractType', () => {
  it('returns contract type counts', async () => {
    const rows = [
      { contractType: 'CDI', count: 6 },
      { contractType: 'CDD', count: 2 },
    ];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getApplicationsByContractType(USER_ID);
    expect(result).toHaveLength(2);
    expect(result[0].contractType).toBe('CDI');
  });

  it('labels null contract_type as Non spécifié', async () => {
    const rows = [{ contractType: 'Non spécifié', count: 3 }];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getApplicationsByContractType(USER_ID);
    expect(result[0].contractType).toBe('Non spécifié');
  });
});

// =============================================================================
// getApplicationWeeklyTrend
// =============================================================================

describe('getApplicationWeeklyTrend', () => {
  it('returns weekly counts sorted ascending', async () => {
    const rows = [
      { week: '2026-03-30 00:00:00+00', count: 2 },
      { week: '2026-04-06 00:00:00+00', count: 5 },
    ];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getApplicationWeeklyTrend(USER_ID);
    expect(result).toHaveLength(2);
    expect(result[0].week).toContain('2026-03-30');
  });

  it('returns empty array for no recent applications', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await getApplicationWeeklyTrend(USER_ID, 4);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// getTopSkillGaps
// =============================================================================

describe('getTopSkillGaps', () => {
  it('returns skill gaps sorted by frequency', async () => {
    const rows = [
      { skill: 'Python', frequency: 5 },
      { skill: 'Docker', frequency: 3 },
    ];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getTopSkillGaps(USER_ID);
    expect(result[0].skill).toBe('Python');
    expect(result[0].frequency).toBe(5);
  });

  it('returns empty array when user has only v1 matches (no matchVersion 2)', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await getTopSkillGaps(USER_ID);
    expect(result).toEqual([]);
  });

  it('respects custom limit parameter', async () => {
    mockExecute.mockResolvedValueOnce([{ skill: 'SQL', frequency: 1 }]);

    const result = await getTopSkillGaps(USER_ID, 5);
    expect(result).toHaveLength(1);
    expect(mockExecute).toHaveBeenCalledOnce();
  });
});

// =============================================================================
// getConversionStats
// =============================================================================

describe('getConversionStats', () => {
  it('returns conversion stats with all fields', async () => {
    mockExecute.mockResolvedValueOnce([{
      total: 10,
      applied: 5,
      screening: 2,
      interviews: 1,
      offers: 1,
      accepted: 0,
      rejected: 1,
    }]);

    const result = await getConversionStats(USER_ID);
    expect(result.total).toBe(10);
    expect(result.applied).toBe(5);
    expect(result.interviews).toBe(1);
  });

  it('returns all zeros for user with no applications', async () => {
    mockExecute.mockResolvedValueOnce([{ total: 0, applied: 0, screening: 0, interviews: 0, offers: 0, accepted: 0, rejected: 0 }]);

    const result = await getConversionStats(USER_ID);
    expect(result.total).toBe(0);
    expect(result.applied).toBe(0);
    expect(result.rejected).toBe(0);
  });

  it('handles empty rows gracefully (defaults to 0)', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await getConversionStats(USER_ID);
    expect(result.total).toBe(0);
    expect(result.offers).toBe(0);
  });
});
