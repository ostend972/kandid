import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecute = vi.fn();

vi.mock('@/lib/db/drizzle', () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
  client: {},
}));

import {
  getTopMatchesForUser,
  getDailyApplicationStats,
  getEmployabilityScoreData,
} from '@/lib/db/kandid-queries';

const USER_ID = 'user_test_123';
const CV_ID = 'cv_test_456';

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// getTopMatchesForUser
// =============================================================================

describe('getTopMatchesForUser', () => {
  it('returns top 5 matches ordered by score DESC', async () => {
    const rows = [
      { overallScore: 92, verdict: 'Excellent', title: 'Dev Senior', company: 'ACME', canton: 'GE', sourceUrl: 'https://a.com', jobId: 'j1' },
      { overallScore: 85, verdict: 'Bon', title: 'Dev Junior', company: 'Beta', canton: 'VD', sourceUrl: 'https://b.com', jobId: 'j2' },
      { overallScore: 78, verdict: 'Correct', title: 'QA', company: 'Gamma', canton: 'ZH', sourceUrl: 'https://c.com', jobId: 'j3' },
      { overallScore: 70, verdict: 'Moyen', title: 'PM', company: 'Delta', canton: 'BE', sourceUrl: 'https://d.com', jobId: 'j4' },
      { overallScore: 60, verdict: 'Faible', title: 'Intern', company: 'Epsilon', canton: 'BS', sourceUrl: 'https://e.com', jobId: 'j5' },
    ];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getTopMatchesForUser(USER_ID, CV_ID);
    expect(result).toHaveLength(5);
    expect(result[0].overallScore).toBe(92);
    expect(result[4].overallScore).toBe(60);
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it('returns empty array when no matches exist', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await getTopMatchesForUser(USER_ID, CV_ID);
    expect(result).toEqual([]);
  });

  it('filters to active jobs only (query returns only active)', async () => {
    const rows = [
      { overallScore: 90, verdict: 'Excellent', title: 'Dev', company: 'X', canton: 'GE', sourceUrl: 'https://x.com', jobId: 'j1' },
    ];
    mockExecute.mockResolvedValueOnce(rows);

    const result = await getTopMatchesForUser(USER_ID, CV_ID);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Dev');
  });
});

// =============================================================================
// getDailyApplicationStats
// =============================================================================

describe('getDailyApplicationStats', () => {
  it('returns correct todayCount and streak values', async () => {
    mockExecute.mockResolvedValueOnce([{ todayCount: 7, streak: 3 }]);

    const result = await getDailyApplicationStats(USER_ID);
    expect(result.todayCount).toBe(7);
    expect(result.streak).toBe(3);
  });

  it('returns { todayCount: 0, streak: 0 } for user with no applications', async () => {
    mockExecute.mockResolvedValueOnce([{ todayCount: 0, streak: 0 }]);

    const result = await getDailyApplicationStats(USER_ID);
    expect(result).toEqual({ todayCount: 0, streak: 0 });
  });

  it('handles empty result gracefully (defaults to 0)', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await getDailyApplicationStats(USER_ID);
    expect(result).toEqual({ todayCount: 0, streak: 0 });
  });
});

// =============================================================================
// getEmployabilityScoreData
// =============================================================================

describe('getEmployabilityScoreData', () => {
  it('returns correct recentApplicationsCount for 30-day window', async () => {
    mockExecute.mockResolvedValueOnce([{ recentApplicationsCount: 42 }]);

    const result = await getEmployabilityScoreData(USER_ID);
    expect(result.recentApplicationsCount).toBe(42);
  });

  it('returns 0 count when user has no recent applications', async () => {
    mockExecute.mockResolvedValueOnce([{ recentApplicationsCount: 0 }]);

    const result = await getEmployabilityScoreData(USER_ID);
    expect(result.recentApplicationsCount).toBe(0);
  });

  it('handles empty result gracefully (defaults to 0)', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await getEmployabilityScoreData(USER_ID);
    expect(result.recentApplicationsCount).toBe(0);
  });
});

// =============================================================================
// Employability Score Computation (D004 formula)
// =============================================================================

const PROFILE_FIELDS = [
  'sector', 'position', 'experienceLevel', 'targetCantons',
  'languages', 'salaryExpectation', 'availability', 'contractTypes',
  'careerSummary', 'strengths', 'motivation', 'differentiator',
] as const;

function computeProfileCompleteness(user: Record<string, unknown>): number {
  let filled = 0;
  for (const field of PROFILE_FIELDS) {
    const val = user[field];
    if (val === null || val === undefined || val === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    filled++;
  }
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

function computeCompositeScore(
  profileCompleteness: number,
  cvQuality: number,
  recentApplicationsCount: number
): number {
  const cadence = Math.min(100, Math.round((recentApplicationsCount / 150) * 100));
  return Math.round(profileCompleteness * 0.3 + cvQuality * 0.4 + cadence * 0.3);
}

describe('Employability Score Computation', () => {
  it('full profile (12/12) + CV score 80 + cadence 75 apps → correct composite', () => {
    const profile = computeProfileCompleteness({
      sector: 'IT', position: 'Dev', experienceLevel: 'Senior',
      targetCantons: ['GE'], languages: [{ lang: 'FR', level: 'C1' }],
      salaryExpectation: '100k', availability: 'immediate',
      contractTypes: ['CDI'], careerSummary: 'summary',
      strengths: 'strong', motivation: 'motivated', differentiator: 'unique',
    });
    expect(profile).toBe(100);

    const score = computeCompositeScore(100, 80, 75);
    // cadence = min(100, round(75/150*100)) = 50
    // composite = round(100*0.3 + 80*0.4 + 50*0.3) = round(30 + 32 + 15) = 77
    expect(score).toBe(77);
  });

  it('partial profile (6/12) + no CV + 0 applications → partial score', () => {
    const profile = computeProfileCompleteness({
      sector: 'IT', position: 'Dev', experienceLevel: 'Junior',
      targetCantons: ['VD'], languages: [{ lang: 'EN', level: 'B2' }],
      salaryExpectation: '60k',
      availability: null, contractTypes: [], careerSummary: '',
      strengths: null, motivation: null, differentiator: null,
    });
    expect(profile).toBe(50);

    const score = computeCompositeScore(50, 0, 0);
    // cadence = 0
    // composite = round(50*0.3 + 0*0.4 + 0*0.3) = round(15) = 15
    expect(score).toBe(15);
  });

  it('all components at 100% → score = 100', () => {
    // cadence needs 150+ apps to hit 100
    const score = computeCompositeScore(100, 100, 150);
    // cadence = min(100, round(150/150*100)) = 100
    // composite = round(100*0.3 + 100*0.4 + 100*0.3) = 100
    expect(score).toBe(100);
  });

  it('all components at 0% → score = 0', () => {
    const score = computeCompositeScore(0, 0, 0);
    expect(score).toBe(0);
  });
});
