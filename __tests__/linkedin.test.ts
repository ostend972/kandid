import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Zod schema tests ─────────────────────────────────────────────────────────

import {
  linkedinStructuredProfileSchema,
  linkedinAuditResultSchema,
  linkedinOptimizeResultSchema,
  linkedinPostSchema,
  linkedinCalendarResultSchema,
} from '@/lib/validations/linkedin';

const validStructuredProfile = {
  headline: 'Senior Software Engineer',
  summary: 'Experienced developer with 10 years in fintech.',
  experience: [
    { position: 'Senior Dev', company: 'Acme Corp', location: 'Zurich', startDate: '2020-01', description: 'Led backend team' },
  ],
  education: [
    { degree: 'MSc Computer Science', institution: 'ETH Zurich', year: '2015' },
  ],
  skills: ['TypeScript', 'React', 'Node.js'],
  certifications: ['AWS Solutions Architect'],
  languages: [{ lang: 'English', level: 'Native' }],
};

const validAuditResult = {
  score: 72,
  weaknesses: [
    { category: 'Headline', description: 'Too generic', impact: 'Low visibility in search' },
  ],
  recommendations: [
    { category: 'Headline', action: 'Add keywords', priority: 'high', example: 'Senior TS Engineer | Fintech' },
  ],
};

const validOptimizeResult = {
  headline: 'Senior TypeScript Engineer | Fintech & Banking',
  summary: 'Experienced developer specializing in scalable fintech solutions.',
};

const validPost = {
  weekNumber: 1,
  dayOfWeek: 'Lundi',
  contentType: 'expertise' as const,
  title: 'Comment structurer un monorepo',
  draftContent: 'Dans cet article, je partage mon expérience...',
};

const validCalendar = Array.from({ length: 8 }, (_, i) => ({
  weekNumber: Math.floor(i / 2) + 1,
  dayOfWeek: i % 2 === 0 ? 'Lundi' : 'Jeudi',
  contentType: (['expertise', 'actualite', 'success_story', 'recommandation'] as const)[i % 4],
  title: `Post ${i + 1}`,
  draftContent: `Content for post ${i + 1}`,
}));

// =============================================================================
// linkedinStructuredProfileSchema
// =============================================================================

describe('linkedinStructuredProfileSchema', () => {
  it('accepts valid structured profile', () => {
    expect(linkedinStructuredProfileSchema.safeParse(validStructuredProfile).success).toBe(true);
  });

  it('rejects missing headline', () => {
    const { headline, ...rest } = validStructuredProfile;
    expect(linkedinStructuredProfileSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing summary', () => {
    const { summary, ...rest } = validStructuredProfile;
    expect(linkedinStructuredProfileSchema.safeParse(rest).success).toBe(false);
  });
});

// =============================================================================
// linkedinAuditResultSchema
// =============================================================================

describe('linkedinAuditResultSchema', () => {
  it('accepts valid audit result', () => {
    expect(linkedinAuditResultSchema.safeParse(validAuditResult).success).toBe(true);
  });

  it('rejects score below 0', () => {
    expect(linkedinAuditResultSchema.safeParse({ ...validAuditResult, score: -1 }).success).toBe(false);
  });

  it('rejects score above 100', () => {
    expect(linkedinAuditResultSchema.safeParse({ ...validAuditResult, score: 101 }).success).toBe(false);
  });

  it('rejects non-integer score', () => {
    expect(linkedinAuditResultSchema.safeParse({ ...validAuditResult, score: 72.5 }).success).toBe(false);
  });
});

// =============================================================================
// linkedinOptimizeResultSchema
// =============================================================================

describe('linkedinOptimizeResultSchema', () => {
  it('accepts valid optimize result', () => {
    expect(linkedinOptimizeResultSchema.safeParse(validOptimizeResult).success).toBe(true);
  });

  it('rejects empty headline', () => {
    expect(linkedinOptimizeResultSchema.safeParse({ ...validOptimizeResult, headline: '' }).success).toBe(false);
  });
});

// =============================================================================
// linkedinPostSchema & linkedinCalendarResultSchema
// =============================================================================

describe('linkedinPostSchema', () => {
  it('accepts valid post', () => {
    expect(linkedinPostSchema.safeParse(validPost).success).toBe(true);
  });

  it('rejects invalid contentType', () => {
    expect(linkedinPostSchema.safeParse({ ...validPost, contentType: 'blog' }).success).toBe(false);
  });

  it('rejects weekNumber 0', () => {
    expect(linkedinPostSchema.safeParse({ ...validPost, weekNumber: 0 }).success).toBe(false);
  });

  it('rejects weekNumber 5', () => {
    expect(linkedinPostSchema.safeParse({ ...validPost, weekNumber: 5 }).success).toBe(false);
  });
});

describe('linkedinCalendarResultSchema', () => {
  it('accepts valid calendar (8 posts)', () => {
    expect(linkedinCalendarResultSchema.safeParse(validCalendar).success).toBe(true);
  });

  it('rejects fewer than 8 posts', () => {
    expect(linkedinCalendarResultSchema.safeParse(validCalendar.slice(0, 7)).success).toBe(false);
  });

  it('rejects more than 20 posts', () => {
    const tooMany = Array.from({ length: 21 }, () => validPost);
    expect(linkedinCalendarResultSchema.safeParse(tooMany).success).toBe(false);
  });
});

// ─── DB query tests (mocked) ──────────────────────────────────────────────────

const mockReturning = vi.fn();
const mockLimit = vi.fn(() => mockReturning.mockResolvedValue([]));
const mockWhere = vi.fn(() => ({ returning: mockReturning, limit: mockLimit }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockOnConflictDoUpdate = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate, returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere, orderBy: mockOrderBy }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    update: (...args: Parameters<typeof mockUpdate>) => mockUpdate(...args),
    insert: (...args: Parameters<typeof mockInsert>) => mockInsert(...args),
    select: (...args: Parameters<typeof mockSelect>) => mockSelect(...args),
  },
  client: {},
}));

import {
  upsertLinkedinProfile,
  getLinkedinProfile,
  updateLinkedinAudit,
  updateLinkedinOptimized,
  updateLinkedinPostContent,
  getLatestPostBatch,
} from '@/lib/db/kandid-queries';

describe('upsertLinkedinProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'profile-1', userId: 'user_1' }]);
  });

  it('calls db.insert for upsert', async () => {
    await upsertLinkedinProfile({
      userId: 'user_1',
      source: 'pdf',
      structured: validStructuredProfile,
      headline: 'Test',
    });
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockValues).toHaveBeenCalledOnce();
    expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
  });
});

describe('updateLinkedinAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'profile-1' }]);
  });

  it('calls db.update with audit fields', async () => {
    await updateLinkedinAudit('user_1', 72, validAuditResult);
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        auditScore: 72,
        auditResult: validAuditResult,
      }),
    );
  });
});

describe('updateLinkedinOptimized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'profile-1' }]);
  });

  it('calls db.update with optimized headline and summary', async () => {
    await updateLinkedinOptimized('user_1', 'New Headline', 'New Summary');
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        optimizedHeadline: 'New Headline',
        optimizedSummary: 'New Summary',
      }),
    );
  });
});
