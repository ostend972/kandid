import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Zod schema tests (no mocking needed) ───────────────────────────────────

import {
  onboardingStep1Schema,
  onboardingStep2Schema,
} from '@/lib/validations/onboarding';

const validStep1 = {
  sector: 'Finance',
  position: 'Analyste',
  experienceLevel: 'mid' as const,
  targetCantons: ['GE', 'VD'],
  languages: [{ lang: 'Français', level: 'C1' as const }],
  salaryExpectation: '80000-100000',
  availability: '1_month' as const,
  contractTypes: ['CDI'],
};

const validStep2 = {
  careerSummary: 'Experienced analyst with 5 years in banking.',
  strengths: ['Analytical', 'Communication', 'Leadership'],
  motivation: 'Looking for growth opportunities in fintech.',
  differentiator: 'Bilingual with cross-border experience.',
};

// =============================================================================
// onboardingStep1Schema
// =============================================================================

describe('onboardingStep1Schema', () => {
  it('accepts valid input', () => {
    const result = onboardingStep1Schema.safeParse(validStep1);
    expect(result.success).toBe(true);
  });

  it('rejects empty sector', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, sector: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty position', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, position: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid experienceLevel', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, experienceLevel: 'intern' });
    expect(result.success).toBe(false);
  });

  it('rejects empty targetCantons array', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, targetCantons: [] });
    expect(result.success).toBe(false);
  });

  it('rejects languages without valid CECR level', () => {
    const result = onboardingStep1Schema.safeParse({
      ...validStep1,
      languages: [{ lang: 'English', level: 'X1' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty salaryExpectation', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, salaryExpectation: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid availability value', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, availability: 'tomorrow' });
    expect(result.success).toBe(false);
  });

  it('rejects empty contractTypes array', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, contractTypes: [] });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// onboardingStep2Schema
// =============================================================================

describe('onboardingStep2Schema', () => {
  it('accepts valid input', () => {
    const result = onboardingStep2Schema.safeParse(validStep2);
    expect(result.success).toBe(true);
  });

  it('rejects careerSummary longer than 500 chars', () => {
    const result = onboardingStep2Schema.safeParse({
      ...validStep2,
      careerSummary: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects strengths with 2 items', () => {
    const result = onboardingStep2Schema.safeParse({
      ...validStep2,
      strengths: ['A', 'B'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects strengths with 4 items', () => {
    const result = onboardingStep2Schema.safeParse({
      ...validStep2,
      strengths: ['A', 'B', 'C', 'D'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty strength strings', () => {
    const result = onboardingStep2Schema.safeParse({
      ...validStep2,
      strengths: ['A', '', 'C'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects motivation longer than 300 chars', () => {
    const result = onboardingStep2Schema.safeParse({
      ...validStep2,
      motivation: 'a'.repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it('rejects differentiator longer than 300 chars', () => {
    const result = onboardingStep2Schema.safeParse({
      ...validStep2,
      differentiator: 'a'.repeat(301),
    });
    expect(result.success).toBe(false);
  });
});

// ─── DB query tests (mocked) ────────────────────────────────────────────────

const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    update: (...args: Parameters<typeof mockUpdate>) => mockUpdate(...args),
  },
  client: {},
}));

import {
  updateUserOnboardingStep1,
  updateUserOnboardingStep2,
} from '@/lib/db/kandid-queries';

describe('updateUserOnboardingStep1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'user_1' }]);
  });

  it('calls db.update with onboardingStep=1 and all fields', async () => {
    await updateUserOnboardingStep1('user_1', validStep1);

    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        sector: 'Finance',
        position: 'Analyste',
        experienceLevel: 'mid',
        targetCantons: ['GE', 'VD'],
        onboardingStep: 1,
      }),
    );
    expect(mockWhere).toHaveBeenCalledOnce();
  });
});

describe('updateUserOnboardingStep2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'user_1' }]);
  });

  it('calls db.update with onboardingStep=2 and onboardingCompletedAt', async () => {
    await updateUserOnboardingStep2('user_1', validStep2);

    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        careerSummary: validStep2.careerSummary,
        strengths: validStep2.strengths,
        motivation: validStep2.motivation,
        differentiator: validStep2.differentiator,
        onboardingStep: 2,
        onboardingCompletedAt: expect.any(Date),
      }),
    );
    expect(mockWhere).toHaveBeenCalledOnce();
  });
});
