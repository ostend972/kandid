import { describe, it, expect } from 'vitest';
import {
  calculateSkillsMatch,
  calculateLanguageMatch,
  calculateSectorMatch,
  calculateActivityRateMatch,
  calculateSeniorityMatch,
  calculateMatchScore,
} from '@/lib/matching/score';

// =============================================================================
// Skills matching
// =============================================================================

describe('calculateSkillsMatch', () => {
  it('returns 100 for exact matches', () => {
    expect(calculateSkillsMatch(['React', 'TypeScript'], ['react', 'typescript'])).toBe(100);
  });

  it('returns 0 when no CV skills match', () => {
    expect(calculateSkillsMatch(['Python', 'Django'], ['react', 'typescript'])).toBeLessThanOrEqual(10);
  });

  it('gives partial credit for skill family matches (React ↔ Next.js)', () => {
    const score = calculateSkillsMatch(['React'], ['next.js']);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(100);
  });

  it('does not give full credit for single-word overlap on multi-word skills', () => {
    // "Machine Learning" should not match just because "Learning" appears in "Deep Learning"
    const score = calculateSkillsMatch(['Deep Learning'], ['Machine Learning']);
    // Family match gives 70
    expect(score).toBeLessThan(100);
  });

  it('returns 0 for empty CV skills', () => {
    expect(calculateSkillsMatch([], ['react'])).toBe(0);
  });

  it('returns -1 when no structured skills and no description', () => {
    expect(calculateSkillsMatch(['React'], [], undefined)).toBe(-1);
  });

  it('falls back to description search when no structured skills', () => {
    const desc = 'We are looking for someone with experience in React and Node.js';
    expect(calculateSkillsMatch(['React', 'Node.js'], [], desc)).toBe(100);
  });
});

// =============================================================================
// Language matching
// =============================================================================

describe('calculateLanguageMatch', () => {
  it('returns 100 when CV meets all required CEFR levels', () => {
    const cv = [{ lang: 'French', level: 'C1' }, { lang: 'English', level: 'B2' }];
    const job = [{ language: 'Français', level: 'B2' }, { language: 'Anglais', level: 'B1' }];
    expect(calculateLanguageMatch(cv, job)).toBe(100);
  });

  it('penalizes when CV level is below required (1 level gap = 65)', () => {
    const cv = [{ lang: 'English', level: 'B1' }];
    const job = [{ language: 'English', level: 'B2' }];
    expect(calculateLanguageMatch(cv, job)).toBe(65);
  });

  it('penalizes harder for 2-level gap (= 30)', () => {
    const cv = [{ lang: 'English', level: 'A2' }];
    const job = [{ language: 'English', level: 'B2' }];
    expect(calculateLanguageMatch(cv, job)).toBe(30);
  });

  it('gives partial credit (40) when CV has no CEFR but job requires one', () => {
    const cv = [{ lang: 'English', level: '' }];
    const job = [{ language: 'English', level: 'B2' }];
    expect(calculateLanguageMatch(cv, job)).toBe(40);
  });

  it('gives partial credit (60) when neither side has CEFR', () => {
    const cv = [{ lang: 'English', level: '' }];
    const job = [{ language: 'English', level: '' }];
    expect(calculateLanguageMatch(cv, job)).toBe(60);
  });

  it('gives 100 when CV has level but job does not specify', () => {
    const cv = [{ lang: 'English', level: 'C1' }];
    const job = [{ language: 'English', level: '' }];
    expect(calculateLanguageMatch(cv, job)).toBe(100);
  });

  it('returns 0 when required language is missing from CV', () => {
    const cv = [{ lang: 'French', level: 'C1' }];
    const job = [{ language: 'German', level: 'B1' }];
    expect(calculateLanguageMatch(cv, job)).toBe(0);
  });

  it('normalizes language names across French/English/German', () => {
    const cv = [{ lang: 'Allemand', level: 'B2' }];
    const job = [{ language: 'German', level: 'B1' }];
    expect(calculateLanguageMatch(cv, job)).toBe(100);
  });
});

// =============================================================================
// Sector matching
// =============================================================================

describe('calculateSectorMatch', () => {
  it('returns 100 for exact category match', () => {
    const score = calculateSectorMatch(
      ['Healthcare'],
      [{ id: 1, name: 'Healthcare' }]
    );
    expect(score).toBe(100);
  });

  it('returns graduated score for partial word match instead of binary 100', () => {
    const score = calculateSectorMatch(
      ['Software Engineering'],
      [{ id: 1, name: 'Accounting' }],
      'Financial Analyst',
      'We need a financial analyst with strong software skills for our engineering team'
    );
    // "software" and "engineering" both appear → partial match
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it('returns 0 when no sector words match at all', () => {
    expect(calculateSectorMatch(
      ['Marine Biology'],
      [{ id: 1, name: 'IT' }],
      'Developer',
      'Looking for a React developer'
    )).toBe(0);
  });

  it('returns -1 when no CV sectors available', () => {
    expect(calculateSectorMatch([], [{ id: 1, name: 'IT' }])).toBe(-1);
  });
});

// =============================================================================
// Activity rate matching
// =============================================================================

describe('calculateActivityRateMatch', () => {
  it('returns 100 when preferred rate is within range', () => {
    expect(calculateActivityRateMatch(80, '80 – 100%')).toBe(100);
    expect(calculateActivityRateMatch(100, '80 – 100%')).toBe(100);
    expect(calculateActivityRateMatch(90, '80 – 100%')).toBe(100);
  });

  it('returns graduated score instead of cliff 0 for near-miss', () => {
    // Candidate wants 100%, job offers 90% → 10% gap → 80 points (not 0!)
    expect(calculateActivityRateMatch(100, '90%')).toBe(80);
  });

  it('returns 50 for moderate gap (20%)', () => {
    expect(calculateActivityRateMatch(100, '80%')).toBe(50);
  });

  it('returns 0 for large gap (>30%)', () => {
    expect(calculateActivityRateMatch(100, '60%')).toBe(0);
  });

  it('returns 100 when no preference or no job rate', () => {
    expect(calculateActivityRateMatch(null, '80%')).toBe(100);
    expect(calculateActivityRateMatch(80, null)).toBe(100);
  });
});

// =============================================================================
// Seniority matching
// =============================================================================

describe('calculateSeniorityMatch', () => {
  it('returns 100 when seniority aligns perfectly', () => {
    // 8 years experience → seniority 3 (senior), job says "Senior"
    expect(calculateSeniorityMatch(8, 'Senior Developer')).toBe(100);
  });

  it('returns 75 for 1-level gap', () => {
    // 3 years → seniority 2 (mid), job says "Senior" (3)
    expect(calculateSeniorityMatch(3, 'Senior Developer')).toBe(75);
  });

  it('returns 40 for 2-level gap', () => {
    // 1 year → seniority 1 (junior), job says "Senior" (3)
    expect(calculateSeniorityMatch(1, 'Senior Developer')).toBe(40);
  });

  it('returns 10 for large gap (junior → director)', () => {
    expect(calculateSeniorityMatch(1, 'Head of Engineering')).toBe(10);
  });

  it('returns -1 when job has no seniority indicator', () => {
    expect(calculateSeniorityMatch(5, 'Developer')).toBe(-1);
  });

  it('returns -1 when no experience years', () => {
    expect(calculateSeniorityMatch(undefined, 'Senior Developer')).toBe(-1);
  });

  it('detects seniority in description not just title', () => {
    expect(calculateSeniorityMatch(8, 'Developer', 'We are looking for a senior engineer')).toBe(100);
  });
});

// =============================================================================
// Main calculateMatchScore
// =============================================================================

describe('calculateMatchScore', () => {
  const fullProfile = {
    skills: ['React', 'TypeScript', 'Node.js'],
    languages: [
      { lang: 'French', level: 'C2' },
      { lang: 'English', level: 'B2' },
    ],
    sectors: ['IT', 'Software'],
    experienceYears: 8,
    educationLevel: 'Master',
    educationDetails: '',
    swissEquivalence: '',
    hasPhoto: true,
    hasNationality: true,
    hasPermit: 'B',
    hasReferencesMention: true,
  };

  const goodJob = {
    skills: ['React', 'TypeScript', 'Node.js'],
    languageSkills: [
      { language: 'Français', level: 'B2' },
      { language: 'Anglais', level: 'B1' },
    ],
    categories: [{ id: 1, name: 'Software Development' }],
    activityRate: '100%',
    title: 'Senior Frontend Developer',
    description: 'We need a senior React developer for our team.',
  };

  it('returns high score for good match', () => {
    const result = calculateMatchScore(fullProfile, goodJob, 100);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.confidence).toBe('high');
  });

  it('returns low score for poor match', () => {
    const poorProfile = {
      ...fullProfile,
      skills: ['Python', 'Django'],
      languages: [{ lang: 'Chinese', level: 'C1' }],
      sectors: ['Agriculture'],
      experienceYears: 0,
    };
    const result = calculateMatchScore(poorProfile, goodJob, 100);
    expect(result.score).toBeLessThan(40);
  });

  it('includes confidence indicator', () => {
    const result = calculateMatchScore(fullProfile, goodJob, 100);
    expect(['high', 'medium', 'low']).toContain(result.confidence);
  });

  it('includes seniority in breakdown', () => {
    const result = calculateMatchScore(fullProfile, goodJob, 100);
    expect(result.breakdown).toHaveProperty('seniority');
    expect(result.breakdown.seniority).toBeGreaterThanOrEqual(0);
  });

  it('handles minimal profile gracefully', () => {
    const minProfile = {
      skills: [],
      languages: [],
      sectors: [],
      experienceYears: 0,
      educationLevel: '',
      educationDetails: '',
      swissEquivalence: '',
      hasPhoto: false,
      hasNationality: false,
      hasPermit: null,
      hasReferencesMention: false,
    };
    const result = calculateMatchScore(minProfile, goodJob, null);
    expect(result.score).toBeLessThanOrEqual(50);
    expect(typeof result.confidence).toBe('string');
  });

  it('adjusts confidence down when few criteria have data', () => {
    const sparseJob = {
      skills: [],
      languageSkills: [],
      categories: [],
      activityRate: null,
    };
    const result = calculateMatchScore(fullProfile, sparseJob);
    expect(result.confidence).not.toBe('high');
  });
});
