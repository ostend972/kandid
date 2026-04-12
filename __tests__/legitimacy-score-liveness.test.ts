import { describe, it, expect } from 'vitest';
import { computeLegitimacyScore, type LegitimacyInput } from '@/lib/jobs/legitimacy-score';

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function makeJob(overrides: Partial<LegitimacyInput> = {}): LegitimacyInput {
  return {
    publishedAt: new Date(),
    expiresAt: daysFromNow(30),
    description: 'A '.repeat(300),
    skills: ['TypeScript', 'React', 'Node.js'],
    salary: '80000-100000 CHF',
    contractType: 'CDI',
    activityRate: '100%',
    status: 'active',
    email: 'hr@company.ch',
    languageSkills: [{ lang: 'French', level: 'C1' }],
    categories: [{ id: 1, name: 'IT' }],
    ...overrides,
  };
}

describe('computeLegitimacyScore — liveness integration', () => {
  it('base score without liveness is unchanged', () => {
    const withoutLiveness = computeLegitimacyScore(makeJob());
    const withUndefined = computeLegitimacyScore(makeJob(), undefined, undefined);
    expect(withoutLiveness.score).toBe(withUndefined.score);
    expect(withoutLiveness.tier).toBe(withUndefined.tier);
  });

  it('liveness active adds +10', () => {
    const base = computeLegitimacyScore(makeJob());
    const active = computeLegitimacyScore(makeJob(), undefined, 'active');
    expect(active.score).toBe(Math.min(100, base.score + 10));
    expect(active.signals.some(s => s.signal === 'liveness' && s.weight === 10)).toBe(true);
  });

  it('liveness expired adds -30 and forces suspicious tier', () => {
    const expired = computeLegitimacyScore(makeJob(), undefined, 'expired');
    expect(expired.tier).toBe('suspicious');
    expect(expired.signals.some(s => s.signal === 'liveness' && s.weight === -30)).toBe(true);
  });

  it('liveness uncertain adds -10', () => {
    const base = computeLegitimacyScore(makeJob());
    const uncertain = computeLegitimacyScore(makeJob(), undefined, 'uncertain');
    expect(uncertain.score).toBe(base.score - 10);
    expect(uncertain.signals.some(s => s.signal === 'liveness' && s.weight === -10)).toBe(true);
  });

  it('high-score job + expired liveness → suspicious', () => {
    const job = makeJob();
    const base = computeLegitimacyScore(job);
    expect(base.tier).toBe('high');
    expect(base.score).toBeGreaterThanOrEqual(60);

    const expired = computeLegitimacyScore(job, undefined, 'expired');
    expect(expired.tier).toBe('suspicious');
  });

  it('undefined liveness → no change from base', () => {
    const base = computeLegitimacyScore(makeJob());
    const noLiveness = computeLegitimacyScore(makeJob(), undefined, undefined);
    expect(noLiveness.score).toBe(base.score);
    expect(noLiveness.tier).toBe(base.tier);
    expect(noLiveness.signals.some(s => s.signal === 'liveness')).toBe(false);
  });

  it('score is clamped to 0 even with expired penalty on low-score job', () => {
    const lowJob = makeJob({
      publishedAt: new Date(Date.now() - 90 * 86400000),
      description: '',
      skills: [],
      salary: null,
      contractType: null,
      activityRate: null,
      email: null,
      languageSkills: null,
      categories: null,
    });
    const result = computeLegitimacyScore(lowJob, undefined, 'expired');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.tier).toBe('suspicious');
  });
});
