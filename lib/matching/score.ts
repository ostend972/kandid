import type { ExtractedProfile } from '@/lib/ai/analyze-cv';

// =============================================================================
// Types
// =============================================================================

export interface MatchResult {
  score: number; // 0-100
  breakdown: {
    skills: number; // 0-100
    languages: number; // 0-100
    sector: number; // 0-100
    activityRate: number; // 0-100
  };
}

export interface JobMatchInput {
  skills: string[];
  languageSkills: Array<{ language: string; level: string }>;
  categories: Array<{ id: number; name: string }>;
  activityRate: string | null;
}

// =============================================================================
// CEFR level ordering
// =============================================================================

const CEFR_LEVELS: Record<string, number> = {
  a1: 1,
  a2: 2,
  b1: 3,
  b2: 4,
  c1: 5,
  c2: 6,
};

function cefrToNumber(level: unknown): number {
  if (!level || typeof level !== "string") return 0;
  const normalized = level.toLowerCase().trim();
  return CEFR_LEVELS[normalized] ?? 0;
}

// =============================================================================
// Language name normalization
// =============================================================================

const LANGUAGE_ALIASES: Record<string, string> = {
  // French
  francais: 'fr',
  français: 'fr',
  french: 'fr',
  fr: 'fr',
  fra: 'fr',
  // German
  allemand: 'de',
  german: 'de',
  de: 'de',
  deu: 'de',
  deutsch: 'de',
  // English
  anglais: 'en',
  english: 'en',
  en: 'en',
  eng: 'en',
  // Italian
  italien: 'it',
  italian: 'it',
  it: 'it',
  ita: 'it',
  italiano: 'it',
  // Spanish
  espagnol: 'es',
  spanish: 'es',
  es: 'es',
  spa: 'es',
  español: 'es',
  // Portuguese
  portugais: 'pt',
  portuguese: 'pt',
  pt: 'pt',
  por: 'pt',
  // Russian
  russe: 'ru',
  russian: 'ru',
  ru: 'ru',
  // Arabic
  arabe: 'ar',
  arabic: 'ar',
  ar: 'ar',
  // Chinese
  chinois: 'zh',
  chinese: 'zh',
  zh: 'zh',
  // Japanese
  japonais: 'ja',
  japanese: 'ja',
  ja: 'ja',
  // Dutch
  neerlandais: 'nl',
  néerlandais: 'nl',
  dutch: 'nl',
  nl: 'nl',
  // Turkish
  turc: 'tr',
  turkish: 'tr',
  tr: 'tr',
  // Romanian
  roumain: 'ro',
  romanian: 'ro',
  ro: 'ro',
};

function normalizeLanguageName(name: unknown): string {
  if (!name || typeof name !== "string") return "";
  const key = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip accents for lookup
  return LANGUAGE_ALIASES[key] ?? key;
}

// =============================================================================
// Sub-scoring functions
// =============================================================================

/**
 * Calculate skills match between CV skills and job required skills.
 * Uses exact + fuzzy word-overlap matching.
 */
export function calculateSkillsMatch(
  cvSkills: string[],
  jobSkills: string[]
): number {
  if (!jobSkills || jobSkills.length === 0) return 50; // neutral
  if (!cvSkills || cvSkills.length === 0) return 0;

  const normalizedCv = cvSkills.map((s) => s.toLowerCase().trim());
  const normalizedJob = jobSkills.map((s) => s.toLowerCase().trim());

  let matchedCount = 0;

  for (const jobSkill of normalizedJob) {
    // 1. Exact match
    if (normalizedCv.includes(jobSkill)) {
      matchedCount++;
      continue;
    }

    // 2. Fuzzy word-overlap match:
    //    Extract significant words (>3 chars) from the job skill,
    //    check if any CV skill contains at least one of those words.
    const jobWords = jobSkill
      .split(/[\s,/\-']+/)
      .filter((w) => w.length > 3);

    if (jobWords.length === 0) continue;

    const hasPartialMatch = normalizedCv.some((cvSkill) =>
      jobWords.some((word) => cvSkill.includes(word))
    );

    if (hasPartialMatch) {
      matchedCount++;
    }
  }

  return Math.round((matchedCount / normalizedJob.length) * 100);
}

/**
 * Calculate language match between CV languages and job language requirements.
 * Checks if the candidate meets each required language at the required CEFR level.
 */
export function calculateLanguageMatch(
  cvLanguages: Array<{ lang: string; level: string }>,
  jobLanguages: Array<{ language: string; level: string }>
): number {
  if (!jobLanguages || jobLanguages.length === 0) return 100;
  if (!cvLanguages || cvLanguages.length === 0) return 0;

  // Filter out invalid entries
  const validJobLangs = jobLanguages.filter(
    (l) => l && typeof l.language === "string" && l.language.length > 0
  );
  if (validJobLangs.length === 0) return 100;

  let matchedCount = 0;

  for (const req of validJobLangs) {
    const reqLangNorm = normalizeLanguageName(req.language);
    const reqLevel = cefrToNumber(req.level);

    const cvMatch = cvLanguages.find(
      (cv) => normalizeLanguageName(cv.lang) === reqLangNorm
    );

    if (cvMatch) {
      const cvLevel = cefrToNumber(cvMatch.level);
      // If no valid CEFR level on either side, count as match if language is present
      if (reqLevel === 0 || cvLevel >= reqLevel) {
        matchedCount++;
      }
    }
  }

  return Math.round((matchedCount / validJobLangs.length) * 100);
}

/**
 * Calculate sector match between CV sectors and job categories.
 * Substring-based: checks if any CV sector keyword appears in any job category name.
 */
export function calculateSectorMatch(
  cvSectors: string[],
  jobCategories: Array<{ id?: number; name: string }>
): number {
  if (!jobCategories || jobCategories.length === 0) return 50; // neutral
  if (!cvSectors || cvSectors.length === 0) return 50; // neutral

  const normalizedCategories = jobCategories.map((c) =>
    c.name.toLowerCase().trim()
  );

  for (const sector of cvSectors) {
    const sectorLower = sector.toLowerCase().trim();
    // Check if the whole sector string appears as substring in any category
    if (normalizedCategories.some((cat) => cat.includes(sectorLower))) {
      return 100;
    }
    // Also check individual significant words from the sector
    const sectorWords = sectorLower
      .split(/[\s,/\-']+/)
      .filter((w) => w.length > 3);
    if (
      sectorWords.length > 0 &&
      normalizedCategories.some((cat) =>
        sectorWords.some((word) => cat.includes(word))
      )
    ) {
      return 100;
    }
  }

  return 0;
}

/**
 * Calculate activity rate match.
 * Parses job rate ranges like "100%", "80 – 100%", "60-80%".
 */
export function calculateActivityRateMatch(
  preferredRate: number | null | undefined,
  jobRate: string | null | undefined
): number {
  if (preferredRate == null || !jobRate) return 100; // compatible with all

  // Parse the job rate string
  // Common formats: "100%", "80 – 100%", "80-100%", "60 - 80%"
  const cleaned = jobRate.replace(/%/g, '').trim();

  // Try to find a range pattern first
  const rangeMatch = cleaned.match(
    /(\d+)\s*[–\-—]\s*(\d+)/
  );

  let min: number;
  let max: number;

  if (rangeMatch) {
    min = parseInt(rangeMatch[1], 10);
    max = parseInt(rangeMatch[2], 10);
  } else {
    // Single value
    const singleMatch = cleaned.match(/(\d+)/);
    if (!singleMatch) return 100; // unparseable => assume compatible
    const val = parseInt(singleMatch[1], 10);
    min = val;
    max = val;
  }

  // Check if preferred rate falls within the range
  return preferredRate >= min && preferredRate <= max ? 100 : 0;
}

// =============================================================================
// Main scoring function
// =============================================================================

/**
 * Calculate the overall match score between a CV profile and a job.
 *
 * Weights:
 *   - Skills:       45%
 *   - Languages:    25%
 *   - Sector:       20%
 *   - Activity rate: 10%
 */
export function calculateMatchScore(
  profile: ExtractedProfile,
  job: JobMatchInput,
  userPreferredRate?: number | null
): MatchResult {
  const skills = calculateSkillsMatch(profile.skills, job.skills);
  const languages = calculateLanguageMatch(
    profile.languages,
    job.languageSkills
  );
  const sector = calculateSectorMatch(profile.sectors, job.categories);
  const activityRate = calculateActivityRateMatch(
    userPreferredRate,
    job.activityRate
  );

  const score = Math.round(
    skills * 0.45 + languages * 0.25 + sector * 0.2 + activityRate * 0.1
  );

  return {
    score,
    breakdown: { skills, languages, sector, activityRate },
  };
}
