import type { ApplicationStatus } from './db/schema';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'draft',
  'applied',
  'screening',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
];

export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['applied', 'withdrawn'],
  applied: ['screening', 'interview', 'rejected', 'withdrawn'],
  screening: ['interview', 'rejected', 'withdrawn'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['accepted', 'rejected', 'withdrawn'],
  accepted: ['withdrawn'],
  rejected: [],
  withdrawn: [],
};

export const CADENCE_CONFIG = {
  applied: { firstFollowUpDays: 7, subsequentDays: 7, maxFollowUps: 2 },
  screening: { firstFollowUpDays: 5, subsequentDays: 5, maxFollowUps: 2 },
  interview: { thankYouDays: 1, subsequentDays: 3, maxFollowUps: 1 },
} as const;

export type UrgencyLevel = 'urgent' | 'overdue' | 'waiting' | 'cold';

export function computeUrgency(
  status: ApplicationStatus,
  daysSinceApp: number,
  daysSinceLastFollowUp: number | null,
  followUpCount: number
): UrgencyLevel {
  if (status === 'applied' || status === 'screening') {
    const cfg = CADENCE_CONFIG[status];
    if (followUpCount >= cfg.maxFollowUps) return 'cold';
    if (followUpCount === 0 && daysSinceApp >= cfg.firstFollowUpDays) return 'overdue';
    if (
      followUpCount > 0 &&
      daysSinceLastFollowUp !== null &&
      daysSinceLastFollowUp >= cfg.subsequentDays
    )
      return 'overdue';
    return 'waiting';
  }

  if (status === 'interview') {
    if (daysSinceApp < CADENCE_CONFIG.interview.thankYouDays) return 'urgent';
    if (daysSinceApp >= CADENCE_CONFIG.interview.subsequentDays) return 'overdue';
    return 'waiting';
  }

  return 'waiting';
}

export function computeNextFollowUpDate(
  status: ApplicationStatus,
  appDate: Date,
  lastFollowUpDate: Date | null,
  followUpCount: number
): Date | null {
  if (status === 'applied' || status === 'screening') {
    const cfg = CADENCE_CONFIG[status];
    if (followUpCount >= cfg.maxFollowUps) return null;
    const base =
      followUpCount > 0 && lastFollowUpDate ? lastFollowUpDate : appDate;
    const days = followUpCount === 0 ? cfg.firstFollowUpDays : cfg.subsequentDays;
    return addDays(base, days);
  }

  if (status === 'interview') {
    return addDays(appDate, CADENCE_CONFIG.interview.thankYouDays);
  }

  return null;
}

export function isValidTransition(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  if (to === 'withdrawn' && from !== 'rejected' && from !== 'withdrawn') return true;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
