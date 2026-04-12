import { describe, it, expect } from 'vitest';
import {
  computeUrgency,
  computeNextFollowUpDate,
  isValidTransition,
  CADENCE_CONFIG,
  VALID_TRANSITIONS,
  APPLICATION_STATUSES,
} from '@/lib/cadence';
import type { ApplicationStatus } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// computeUrgency — applied status
// ---------------------------------------------------------------------------

describe('computeUrgency — applied', () => {
  it('returns waiting when within first follow-up window', () => {
    expect(computeUrgency('applied', 3, null, 0)).toBe('waiting');
  });

  it('returns overdue at exactly 7 days with 0 follow-ups', () => {
    expect(computeUrgency('applied', 7, null, 0)).toBe('overdue');
  });

  it('returns overdue when subsequent follow-up is due', () => {
    expect(computeUrgency('applied', 14, 7, 1)).toBe('overdue');
  });

  it('returns waiting when subsequent follow-up is not yet due', () => {
    expect(computeUrgency('applied', 10, 3, 1)).toBe('waiting');
  });

  it('returns cold when max follow-ups reached', () => {
    expect(computeUrgency('applied', 30, 14, 2)).toBe('cold');
  });
});

// ---------------------------------------------------------------------------
// computeUrgency — screening
// ---------------------------------------------------------------------------

describe('computeUrgency — screening', () => {
  it('returns waiting within window', () => {
    expect(computeUrgency('screening', 2, null, 0)).toBe('waiting');
  });

  it('returns overdue at 5 days with 0 follow-ups', () => {
    expect(computeUrgency('screening', 5, null, 0)).toBe('overdue');
  });

  it('returns cold at max follow-ups', () => {
    expect(computeUrgency('screening', 20, 10, 2)).toBe('cold');
  });
});

// ---------------------------------------------------------------------------
// computeUrgency — interview
// ---------------------------------------------------------------------------

describe('computeUrgency — interview', () => {
  it('returns urgent within thank-you window (day 0)', () => {
    expect(computeUrgency('interview', 0, null, 0)).toBe('urgent');
  });

  it('returns waiting at exactly 1 day', () => {
    expect(computeUrgency('interview', 1, null, 0)).toBe('waiting');
  });

  it('returns overdue after 3 days', () => {
    expect(computeUrgency('interview', 3, null, 0)).toBe('overdue');
  });

  it('returns waiting at 2 days', () => {
    expect(computeUrgency('interview', 2, null, 0)).toBe('waiting');
  });
});

// ---------------------------------------------------------------------------
// computeUrgency — non-actionable statuses
// ---------------------------------------------------------------------------

describe('computeUrgency — non-actionable', () => {
  it.each(['draft', 'offer', 'accepted', 'rejected', 'withdrawn'] as ApplicationStatus[])(
    'returns waiting for %s',
    (status) => {
      expect(computeUrgency(status, 30, null, 0)).toBe('waiting');
    }
  );
});

// ---------------------------------------------------------------------------
// computeNextFollowUpDate
// ---------------------------------------------------------------------------

describe('computeNextFollowUpDate', () => {
  const appDate = new Date('2026-04-01T00:00:00Z');
  const followUpDate = new Date('2026-04-08T00:00:00Z');

  it('returns appDate + 7 for applied with 0 follow-ups', () => {
    const result = computeNextFollowUpDate('applied', appDate, null, 0);
    expect(result?.toISOString().split('T')[0]).toBe('2026-04-08');
  });

  it('returns lastFollowUp + 7 for applied with 1 follow-up', () => {
    const result = computeNextFollowUpDate('applied', appDate, followUpDate, 1);
    expect(result?.toISOString().split('T')[0]).toBe('2026-04-15');
  });

  it('returns null for applied when max follow-ups reached (cold)', () => {
    expect(computeNextFollowUpDate('applied', appDate, followUpDate, 2)).toBeNull();
  });

  it('returns appDate + 1 for interview (thank-you)', () => {
    const result = computeNextFollowUpDate('interview', appDate, null, 0);
    expect(result?.toISOString().split('T')[0]).toBe('2026-04-02');
  });

  it('returns appDate + 5 for screening with 0 follow-ups', () => {
    const result = computeNextFollowUpDate('screening', appDate, null, 0);
    expect(result?.toISOString().split('T')[0]).toBe('2026-04-06');
  });

  it('returns null for non-actionable statuses', () => {
    expect(computeNextFollowUpDate('draft', appDate, null, 0)).toBeNull();
    expect(computeNextFollowUpDate('offer', appDate, null, 0)).toBeNull();
    expect(computeNextFollowUpDate('rejected', appDate, null, 0)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isValidTransition
// ---------------------------------------------------------------------------

describe('isValidTransition', () => {
  it('accepts draft → applied', () => {
    expect(isValidTransition('draft', 'applied')).toBe(true);
  });

  it('accepts applied → screening', () => {
    expect(isValidTransition('applied', 'screening')).toBe(true);
  });

  it('accepts applied → interview', () => {
    expect(isValidTransition('applied', 'interview')).toBe(true);
  });

  it('accepts screening → interview', () => {
    expect(isValidTransition('screening', 'interview')).toBe(true);
  });

  it('accepts interview → offer', () => {
    expect(isValidTransition('interview', 'offer')).toBe(true);
  });

  it('accepts offer → accepted', () => {
    expect(isValidTransition('offer', 'accepted')).toBe(true);
  });

  it('rejects draft → offer (skipping steps)', () => {
    expect(isValidTransition('draft', 'offer')).toBe(false);
  });

  it('rejects rejected → applied (terminal state)', () => {
    expect(isValidTransition('rejected', 'applied')).toBe(false);
  });

  it('rejects withdrawn → applied (terminal state)', () => {
    expect(isValidTransition('withdrawn', 'applied')).toBe(false);
  });

  it('allows any non-terminal status → withdrawn', () => {
    const nonTerminal: ApplicationStatus[] = ['draft', 'applied', 'screening', 'interview', 'offer', 'accepted'];
    for (const from of nonTerminal) {
      expect(isValidTransition(from, 'withdrawn')).toBe(true);
    }
  });

  it('rejects rejected → withdrawn', () => {
    expect(isValidTransition('rejected', 'withdrawn')).toBe(false);
  });

  it('rejects withdrawn → withdrawn', () => {
    expect(isValidTransition('withdrawn', 'withdrawn')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Boundary / negative tests
// ---------------------------------------------------------------------------

describe('computeUrgency — boundary conditions', () => {
  it('6 days applied = waiting (below 7-day threshold)', () => {
    expect(computeUrgency('applied', 6, null, 0)).toBe('waiting');
  });

  it('7 days applied = overdue (at threshold)', () => {
    expect(computeUrgency('applied', 7, null, 0)).toBe('overdue');
  });

  it('zero follow-ups with null daysSinceLastFollowUp still works', () => {
    expect(computeUrgency('applied', 3, null, 0)).toBe('waiting');
  });
});

describe('VALID_TRANSITIONS completeness', () => {
  it('every APPLICATION_STATUS has a transitions entry', () => {
    for (const status of APPLICATION_STATUSES) {
      expect(VALID_TRANSITIONS).toHaveProperty(status);
    }
  });
});

describe('CADENCE_CONFIG', () => {
  it('applied: 7d first, 7d subsequent, max 2', () => {
    expect(CADENCE_CONFIG.applied.firstFollowUpDays).toBe(7);
    expect(CADENCE_CONFIG.applied.subsequentDays).toBe(7);
    expect(CADENCE_CONFIG.applied.maxFollowUps).toBe(2);
  });

  it('interview: 1d thank-you', () => {
    expect(CADENCE_CONFIG.interview.thankYouDays).toBe(1);
  });
});
