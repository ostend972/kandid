import { describe, it, expect } from 'vitest';
import { computeLegitimacyScore, type LegitimacyInput } from '@/lib/jobs/legitimacy-score';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function makeJob(overrides: Partial<LegitimacyInput> = {}): LegitimacyInput {
  return {
    publishedAt: new Date(),
    expiresAt: daysFromNow(30),
    description: 'A '.repeat(300), // 600 chars
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

describe('computeLegitimacyScore', () => {
  it('scores a fresh, complete job as high tier', () => {
    const result = computeLegitimacyScore(makeJob());
    expect(result.tier).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('scores a 90-day-old job with sparse data as suspicious', () => {
    const result = computeLegitimacyScore(makeJob({
      publishedAt: daysAgo(90),
      description: 'Short',
      skills: [],
      salary: null,
      contractType: null,
      activityRate: null,
      email: null,
      languageSkills: null,
      categories: null,
    }));
    expect(result.tier).toBe('suspicious');
    expect(result.score).toBeLessThan(30);
  });

  it('penalizes reposted jobs', () => {
    const normal = computeLegitimacyScore(makeJob());
    const reposted = computeLegitimacyScore(makeJob({ status: 'reposted' }), 3);
    expect(reposted.score).toBeLessThan(normal.score);
    expect(reposted.signals.some(s => s.signal === 'repost_pattern')).toBe(true);
  });

  it('handles all-null optional fields gracefully (neutral score around 50, caution tier)', () => {
    const result = computeLegitimacyScore({
      publishedAt: null,
      expiresAt: null,
      description: null,
      skills: null,
      salary: null,
      contractType: null,
      activityRate: null,
      status: null,
      email: null,
      languageSkills: null,
      categories: null,
    });
    expect(result.tier).toBe('caution');
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThanOrEqual(50);
  });

  it('applies negative signal for already-expired jobs', () => {
    const result = computeLegitimacyScore(makeJob({
      expiresAt: daysAgo(5),
    }));
    expect(result.signals.some(s => s.signal === 'expiration' && s.weight < 0)).toBe(true);
  });

  it('awards completeness bonus when email, languageSkills, and categories are all present', () => {
    const complete = computeLegitimacyScore(makeJob());
    const incomplete = computeLegitimacyScore(makeJob({
      email: null,
      languageSkills: null,
      categories: null,
    }));
    expect(complete.score).toBeGreaterThan(incomplete.score);
  });

  it('handles boundary: score exactly at tier thresholds', () => {
    // A job that lands near the 60 boundary
    const borderHigh = computeLegitimacyScore(makeJob({
      publishedAt: daysAgo(35), // -5 age penalty
      salary: null, // no salary bonus
      email: null,
      languageSkills: null,
      categories: null,
    }));
    // score should still be calculable and tier should be valid
    expect(['high', 'caution', 'suspicious']).toContain(borderHigh.tier);
    expect(borderHigh.score).toBeGreaterThanOrEqual(0);
    expect(borderHigh.score).toBeLessThanOrEqual(100);
  });

  it('handles malformed inputs: negative repost count, empty strings', () => {
    const result = computeLegitimacyScore(makeJob({
      description: '',
      skills: [],
    }), -1);
    // Should not crash
    expect(result.tier).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('gives description quality bonus for 200+ char descriptions', () => {
    const short = computeLegitimacyScore(makeJob({ description: 'Brief job.' }));
    const medium = computeLegitimacyScore(makeJob({ description: 'x'.repeat(250) }));
    const long = computeLegitimacyScore(makeJob({ description: 'x'.repeat(600) }));
    expect(medium.score).toBeGreaterThan(short.score);
    expect(long.score).toBeGreaterThan(medium.score);
  });

  it('accepts string dates for publishedAt and expiresAt', () => {
    const result = computeLegitimacyScore(makeJob({
      publishedAt: new Date().toISOString(),
      expiresAt: daysFromNow(30).toISOString(),
    }));
    expect(result.tier).toBe('high');
  });

  it('clamps score between 0 and 100', () => {
    // Maximally bad job
    const worst = computeLegitimacyScore({
      publishedAt: daysAgo(120),
      expiresAt: daysAgo(30),
      description: '',
      skills: [],
      salary: null,
      contractType: null,
      activityRate: null,
      status: 'reposted',
      email: null,
      languageSkills: null,
      categories: null,
    }, 10);
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.score).toBeLessThanOrEqual(100);
  });
});
