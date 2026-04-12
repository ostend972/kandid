import type { LegitimacyTier, LegitimacySignal, LegitimacyResult } from '@/lib/db/schema';

export type { LegitimacyTier, LegitimacySignal, LegitimacyResult };

export interface LegitimacyInput {
  publishedAt: Date | string | null | undefined;
  expiresAt: Date | string | null | undefined;
  description: string | null | undefined;
  skills: string[] | null | undefined;
  salary: string | null | undefined;
  contractType: string | null | undefined;
  activityRate: string | null | undefined;
  status: string | null | undefined;
  email: string | null | undefined;
  languageSkills: unknown[] | null | undefined;
  categories: unknown[] | null | undefined;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function toDate(val: Date | string | null | undefined): Date | null {
  if (val == null) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function computeLegitimacyScore(
  input: LegitimacyInput,
  repostCount?: number,
): LegitimacyResult {
  const signals: LegitimacySignal[] = [];
  let score = 50;
  const now = new Date();

  // --- Posting age ---
  const published = toDate(input.publishedAt);
  if (published) {
    const age = daysBetween(published, now);
    if (age <= 14) {
      signals.push({ signal: 'posting_age', finding: `Fresh posting (${age}d old)`, weight: 10 });
      score += 10;
    } else if (age <= 30) {
      signals.push({ signal: 'posting_age', finding: `Recent posting (${age}d old)`, weight: 5 });
      score += 5;
    } else if (age <= 60) {
      signals.push({ signal: 'posting_age', finding: `Aging posting (${age}d old)`, weight: -5 });
      score -= 5;
    } else {
      signals.push({ signal: 'posting_age', finding: `Stale posting (${age}d old)`, weight: -15 });
      score -= 15;
    }
  }

  // --- Description quality ---
  const desc = input.description ?? '';
  if (desc.length >= 500) {
    signals.push({ signal: 'description_quality', finding: 'Detailed description (500+ chars)', weight: 10 });
    score += 10;
  } else if (desc.length >= 200) {
    signals.push({ signal: 'description_quality', finding: 'Moderate description (200+ chars)', weight: 5 });
    score += 5;
  } else if (desc.length > 0) {
    signals.push({ signal: 'description_quality', finding: `Short description (${desc.length} chars)`, weight: -10 });
    score -= 10;
  } else {
    signals.push({ signal: 'description_quality', finding: 'No description', weight: -15 });
    score -= 15;
  }

  // --- Skills count ---
  const skills = input.skills ?? [];
  if (skills.length >= 3) {
    signals.push({ signal: 'skills_specificity', finding: `${skills.length} skills listed`, weight: 5 });
    score += 5;
  } else if (skills.length === 0) {
    signals.push({ signal: 'skills_specificity', finding: 'No skills listed', weight: -5 });
    score -= 5;
  }

  // --- Salary presence ---
  if (input.salary) {
    signals.push({ signal: 'salary_transparency', finding: 'Salary disclosed', weight: 5 });
    score += 5;
  }

  // --- Contract / activity specified ---
  if (input.contractType) {
    signals.push({ signal: 'contract_specified', finding: `Contract type: ${input.contractType}`, weight: 3 });
    score += 3;
  }
  if (input.activityRate) {
    signals.push({ signal: 'activity_specified', finding: `Activity rate: ${input.activityRate}`, weight: 2 });
    score += 2;
  }

  // --- Repost detection ---
  const isReposted = input.status === 'reposted';
  const rCount = repostCount ?? 0;
  if (isReposted || rCount > 0) {
    const penalty = Math.min(5 + rCount * 5, 25);
    signals.push({ signal: 'repost_pattern', finding: `Reposted ${rCount}x`, weight: -penalty });
    score -= penalty;
  }

  // --- Expiration window ---
  const expires = toDate(input.expiresAt);
  if (expires) {
    const daysUntilExpiry = daysBetween(now, expires);
    if (daysUntilExpiry < 0) {
      signals.push({ signal: 'expiration', finding: 'Already expired', weight: -10 });
      score -= 10;
    } else if (daysUntilExpiry <= 3) {
      signals.push({ signal: 'expiration', finding: `Expires in ${daysUntilExpiry}d`, weight: -5 });
      score -= 5;
    }
  }

  // --- Completeness bonus ---
  let completeness = 0;
  if (input.email) completeness++;
  if (Array.isArray(input.languageSkills) && input.languageSkills.length > 0) completeness++;
  if (Array.isArray(input.categories) && input.categories.length > 0) completeness++;
  if (completeness >= 2) {
    signals.push({ signal: 'completeness', finding: `${completeness}/3 optional fields present`, weight: 5 });
    score += 5;
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  const tier: LegitimacyTier = score >= 60 ? 'high' : score >= 30 ? 'caution' : 'suspicious';

  return { tier, score, signals };
}
