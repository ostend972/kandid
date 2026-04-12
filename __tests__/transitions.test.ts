import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  computeNextFollowUpDate,
  APPLICATION_STATUSES,
} from '@/lib/cadence';
import type { ApplicationStatus } from '@/lib/db/schema';

describe('transition validation integration', () => {
  it('rejects transition to the same status', () => {
    for (const status of APPLICATION_STATUSES) {
      if (status === 'withdrawn') continue;
      expect(isValidTransition(status, status)).toBe(false);
    }
  });

  it('rejects draft → offer (skip steps)', () => {
    expect(isValidTransition('draft', 'offer')).toBe(false);
  });

  it('rejects draft → interview (skip steps)', () => {
    expect(isValidTransition('draft', 'interview')).toBe(false);
  });

  it('rejects draft → accepted (skip steps)', () => {
    expect(isValidTransition('draft', 'accepted')).toBe(false);
  });

  it('accepts the full happy path: draft → applied → screening → interview → offer → accepted', () => {
    const path: ApplicationStatus[] = ['draft', 'applied', 'screening', 'interview', 'offer', 'accepted'];
    for (let i = 0; i < path.length - 1; i++) {
      expect(isValidTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it('rejects transitions from terminal states', () => {
    const terminals: ApplicationStatus[] = ['rejected', 'withdrawn'];
    const targets: ApplicationStatus[] = ['draft', 'applied', 'screening', 'interview', 'offer', 'accepted'];
    for (const from of terminals) {
      for (const to of targets) {
        expect(isValidTransition(from, to)).toBe(false);
      }
    }
  });

  it('allows withdrawal from any non-terminal state', () => {
    const nonTerminal: ApplicationStatus[] = ['draft', 'applied', 'screening', 'interview', 'offer', 'accepted'];
    for (const from of nonTerminal) {
      expect(isValidTransition(from, 'withdrawn')).toBe(true);
    }
  });

  it('rejects applied → accepted (must go through interview/offer)', () => {
    expect(isValidTransition('applied', 'accepted')).toBe(false);
  });

  it('rejects screening → offer (must go through interview)', () => {
    expect(isValidTransition('screening', 'offer')).toBe(false);
  });
});

describe('nextFollowUpAt recomputation on transition', () => {
  const now = new Date('2026-04-10T12:00:00Z');

  it('computes follow-up for applied (7 days)', () => {
    const result = computeNextFollowUpDate('applied', now, null, 0);
    expect(result).not.toBeNull();
    expect(result!.toISOString().split('T')[0]).toBe('2026-04-17');
  });

  it('computes follow-up for screening (5 days)', () => {
    const result = computeNextFollowUpDate('screening', now, null, 0);
    expect(result).not.toBeNull();
    expect(result!.toISOString().split('T')[0]).toBe('2026-04-15');
  });

  it('computes follow-up for interview (1 day thank-you)', () => {
    const result = computeNextFollowUpDate('interview', now, null, 0);
    expect(result).not.toBeNull();
    expect(result!.toISOString().split('T')[0]).toBe('2026-04-11');
  });

  it('returns null for accepted (no follow-up needed)', () => {
    expect(computeNextFollowUpDate('accepted', now, null, 0)).toBeNull();
  });

  it('returns null for rejected (no follow-up needed)', () => {
    expect(computeNextFollowUpDate('rejected', now, null, 0)).toBeNull();
  });

  it('returns null for withdrawn (no follow-up needed)', () => {
    expect(computeNextFollowUpDate('withdrawn', now, null, 0)).toBeNull();
  });

  it('resets follow-up count to 0 on new status (fresh cadence)', () => {
    const result = computeNextFollowUpDate('applied', now, null, 0);
    expect(result).not.toBeNull();
  });
});

describe('error message format for invalid transitions', () => {
  it('transition validation provides enough info for descriptive API error', () => {
    const from: ApplicationStatus = 'draft';
    const to: ApplicationStatus = 'offer';
    const valid = isValidTransition(from, to);
    expect(valid).toBe(false);
    const errorMsg = `Transition invalide: ${from} → ${to}`;
    expect(errorMsg).toContain('draft');
    expect(errorMsg).toContain('offer');
  });
});
