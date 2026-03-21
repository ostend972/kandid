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
  title?: string;
  description?: string;
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
  jobSkills: string[],
  jobDescription?: string
): number {
  if (!cvSkills || cvSkills.length === 0) return 0;

  const normalizedCv = cvSkills
    .map((s) => typeof s === "string" ? s.toLowerCase().trim() : "")
    .filter(Boolean);

  if (normalizedCv.length === 0) return 0;

  // Strategy 1: If job has structured skills, match against them
  const hasStructuredSkills = jobSkills && jobSkills.length > 0;

  if (hasStructuredSkills) {
    const normalizedJob = jobSkills.map((s) =>
      typeof s === "string" ? s.toLowerCase().trim() : ""
    ).filter(Boolean);

    let matchedCount = 0;
    for (const jobSkill of normalizedJob) {
      if (normalizedCv.includes(jobSkill)) { matchedCount++; continue; }
      const jobWords = jobSkill.split(/[\s,/\-']+/).filter((w) => w.length > 3);
      if (jobWords.length > 0 && normalizedCv.some((cv) => jobWords.some((w) => cv.includes(w)))) {
        matchedCount++;
      }
    }
    return Math.round((matchedCount / normalizedJob.length) * 100);
  }

  // Strategy 2: No structured skills — search CV skills in job description text
  if (!jobDescription || jobDescription.length < 20) return -1; // -1 = no data

  const descLower = jobDescription.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let found = 0;

  for (const skill of normalizedCv) {
    const skillNorm = skill.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Check if the skill (or significant words from it) appears in description
    if (descLower.includes(skillNorm)) {
      found++;
      continue;
    }
    // Try individual significant words
    const words = skillNorm.split(/[\s,/\-']+/).filter((w) => w.length > 3);
    if (words.length > 0 && words.some((w) => descLower.includes(w))) {
      found++;
    }
  }

  return Math.round((found / normalizedCv.length) * 100);
}

/**
 * Calculate language match between CV languages and job language requirements.
 * Checks if the candidate meets each required language at the required CEFR level.
 */
export function calculateLanguageMatch(
  cvLanguages: Array<{ lang: string; level: string }>,
  jobLanguages: Array<{ language: string; level: string }>,
  jobDescription?: string
): number {
  if (!cvLanguages || cvLanguages.length === 0) return 0;

  // Filter out invalid entries
  const validJobLangs = (jobLanguages || []).filter(
    (l) => l && typeof l.language === "string" && l.language.length > 0
  );

  // If no structured language requirements, try to detect from description
  if (validJobLangs.length === 0) {
    if (!jobDescription) return -1; // no data
    const descLower = jobDescription.toLowerCase();
    const langKeywords: Record<string, string[]> = {
      fr: ["francais", "français", "french", "langue maternelle"],
      de: ["allemand", "german", "deutsch"],
      en: ["anglais", "english", "englisch"],
      it: ["italien", "italian", "italiano"],
    };
    // Detect which languages are mentioned in description
    const requiredLangs: string[] = [];
    for (const [code, keywords] of Object.entries(langKeywords)) {
      if (keywords.some((kw) => descLower.includes(kw))) {
        requiredLangs.push(code);
      }
    }
    if (requiredLangs.length === 0) return -1; // no language requirement detected
    // Check how many the CV candidate has
    let matched = 0;
    for (const reqLang of requiredLangs) {
      if (cvLanguages.some((cv) => normalizeLanguageName(cv.lang) === reqLang)) {
        matched++;
      }
    }
    return Math.round((matched / requiredLangs.length) * 100);
  }

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
  jobCategories: Array<{ id?: number; name: string }>,
  jobTitle?: string,
  jobDescription?: string
): number {
  if (!cvSectors || cvSectors.length === 0) return -1; // no data

  // Build searchable text from categories + title + description
  const normalizedCategories = (jobCategories || [])
    .filter((c) => c && typeof c.name === "string")
    .map((c) => c.name.toLowerCase().trim())
    .filter(Boolean);

  const searchText = [
    ...normalizedCategories,
    jobTitle?.toLowerCase() || "",
    (jobDescription || "").toLowerCase().substring(0, 2000), // first 2000 chars
  ].join(" ");

  if (searchText.trim().length < 10) return -1; // no data

  for (const sector of cvSectors) {
    if (!sector || typeof sector !== "string") continue;
    const sectorLower = sector.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (searchText.includes(sectorLower)) return 100;

    const sectorWords = sectorLower
      .split(/[\s,/\-']+/)
      .filter((w) => w.length > 3);
    if (sectorWords.length > 0 && sectorWords.some((word) => searchText.includes(word))) {
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
  const skillsRaw = calculateSkillsMatch(profile.skills, job.skills, job.description);
  const languagesRaw = calculateLanguageMatch(
    profile.languages,
    job.languageSkills,
    job.description
  );
  const sectorRaw = calculateSectorMatch(
    profile.sectors,
    job.categories,
    job.title,
    job.description
  );
  const activityRate = calculateActivityRateMatch(
    userPreferredRate,
    job.activityRate
  );

  // -1 means "no data available" — don't count this criterion
  // Instead of giving a neutral 50, we redistribute the weight
  const criteria: Array<{ value: number; weight: number; key: string }> = [];

  if (skillsRaw >= 0) criteria.push({ value: skillsRaw, weight: 0.45, key: "skills" });
  if (languagesRaw >= 0) criteria.push({ value: languagesRaw, weight: 0.25, key: "languages" });
  if (sectorRaw >= 0) criteria.push({ value: sectorRaw, weight: 0.20, key: "sector" });
  criteria.push({ value: activityRate, weight: 0.10, key: "activityRate" });

  // Redistribute weights proportionally
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  let score = 0;
  for (const c of criteria) {
    score += c.value * (c.weight / totalWeight);
  }

  return {
    score: Math.round(score),
    breakdown: {
      skills: Math.max(0, skillsRaw),
      languages: Math.max(0, languagesRaw),
      sector: Math.max(0, sectorRaw),
      activityRate,
    },
  };
}
