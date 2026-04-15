import type { ExtractedProfile } from '@/lib/ai/analyze-cv';

// =============================================================================
// Types
// =============================================================================

export interface MatchResult {
  score: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    skills: number; // 0-100
    languages: number; // 0-100
    sector: number; // 0-100
    activityRate: number; // 0-100
    seniority: number; // 0-100
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
  francais: 'fr', français: 'fr', french: 'fr', fr: 'fr', fra: 'fr',
  allemand: 'de', german: 'de', de: 'de', deu: 'de', deutsch: 'de',
  anglais: 'en', english: 'en', en: 'en', eng: 'en',
  italien: 'it', italian: 'it', it: 'it', ita: 'it', italiano: 'it',
  espagnol: 'es', spanish: 'es', es: 'es', spa: 'es', español: 'es',
  portugais: 'pt', portuguese: 'pt', pt: 'pt', por: 'pt',
  russe: 'ru', russian: 'ru', ru: 'ru',
  arabe: 'ar', arabic: 'ar', ar: 'ar',
  chinois: 'zh', chinese: 'zh', zh: 'zh',
  japonais: 'ja', japanese: 'ja', ja: 'ja',
  neerlandais: 'nl', néerlandais: 'nl', dutch: 'nl', nl: 'nl',
  turc: 'tr', turkish: 'tr', tr: 'tr',
  roumain: 'ro', romanian: 'ro', ro: 'ro',
};

function normalizeLanguageName(name: unknown): string {
  if (!name || typeof name !== "string") return "";
  const key = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return LANGUAGE_ALIASES[key] ?? key;
}

// =============================================================================
// Skill synonyms — groups of interchangeable/related skills
// =============================================================================

const SKILL_FAMILIES: string[][] = [
  ['react', 'reactjs', 'react.js', 'nextjs', 'next.js', 'gatsby'],
  ['vue', 'vuejs', 'vue.js', 'nuxt', 'nuxtjs', 'nuxt.js'],
  ['angular', 'angularjs', 'angular.js'],
  ['javascript', 'js', 'typescript', 'ts'],
  ['python', 'python3'],
  ['java', 'kotlin', 'scala'],
  ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
  ['ruby', 'ruby on rails', 'rails', 'ror'],
  ['php', 'laravel', 'symfony'],
  ['go', 'golang'],
  ['rust', 'rustlang'],
  ['swift', 'swiftui', 'objective-c', 'objc'],
  ['docker', 'kubernetes', 'k8s', 'container'],
  ['aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'cloud'],
  ['sql', 'mysql', 'postgresql', 'postgres', 'mariadb', 'sqlite'],
  ['mongodb', 'mongo', 'nosql', 'dynamodb', 'couchdb'],
  ['redis', 'memcached'],
  ['git', 'github', 'gitlab', 'bitbucket'],
  ['ci/cd', 'jenkins', 'github actions', 'circleci', 'gitlab ci'],
  ['figma', 'sketch', 'adobe xd', 'ui/ux', 'ux design', 'ui design'],
  ['machine learning', 'ml', 'deep learning', 'ai', 'artificial intelligence'],
  ['data science', 'data analysis', 'data engineering', 'etl'],
  ['excel', 'google sheets', 'spreadsheet'],
  ['sap', 'erp', 'oracle erp'],
  ['salesforce', 'crm', 'hubspot'],
  ['photoshop', 'illustrator', 'indesign', 'adobe creative'],
  ['linux', 'unix', 'bash', 'shell'],
  ['terraform', 'ansible', 'puppet', 'chef', 'iac'],
  ['scrum', 'agile', 'kanban', 'safe'],
  ['project management', 'gestion de projet', 'projektmanagement'],
];

const skillFamilyIndex = new Map<string, number>();
SKILL_FAMILIES.forEach((family, idx) => {
  for (const skill of family) {
    skillFamilyIndex.set(skill.toLowerCase(), idx);
  }
});

function getSkillFamily(skill: string): number | undefined {
  return skillFamilyIndex.get(skill.toLowerCase());
}

// =============================================================================
// Seniority inference from title/description
// =============================================================================

const SENIORITY_PATTERNS: Array<{ pattern: RegExp; level: number }> = [
  { pattern: /\b(stagiaire|intern|stage|praktik)\b/i, level: 0 },
  { pattern: /\b(junior|jr\.?|débutant|entry[\s-]?level|einsteiger)\b/i, level: 1 },
  { pattern: /\b(confirmé|mid[\s-]?level|intermédiaire|experienced)\b/i, level: 2 },
  { pattern: /\b(senior|sr\.?|expérimenté|erfahren)\b/i, level: 3 },
  { pattern: /\b(lead|principal|staff|architecte|architect)\b/i, level: 4 },
  { pattern: /\b(head of|director|directeur|vp|vice[\s-]?president|c[tio]o|chief)\b/i, level: 5 },
];

function inferSeniorityFromText(text: string): number | null {
  if (!text) return null;
  let highest: number | null = null;
  for (const { pattern, level } of SENIORITY_PATTERNS) {
    if (pattern.test(text)) {
      if (highest === null || level > highest) highest = level;
    }
  }
  return highest;
}

function experienceToSeniority(years: number): number {
  if (years <= 0) return 0;
  if (years <= 2) return 1;
  if (years <= 5) return 2;
  if (years <= 10) return 3;
  if (years <= 15) return 4;
  return 5;
}

// =============================================================================
// Sub-scoring functions
// =============================================================================

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

  const hasStructuredSkills = jobSkills && jobSkills.length > 0;

  if (hasStructuredSkills) {
    const normalizedJob = jobSkills.map((s) =>
      typeof s === "string" ? s.toLowerCase().trim() : ""
    ).filter(Boolean);

    let totalPoints = 0;
    for (const jobSkill of normalizedJob) {
      // Exact match
      if (normalizedCv.includes(jobSkill)) { totalPoints += 100; continue; }

      // Family match — same technology family (e.g. React ↔ Next.js)
      const jobFamily = getSkillFamily(jobSkill);
      if (jobFamily !== undefined && normalizedCv.some((cv) => getSkillFamily(cv) === jobFamily)) {
        totalPoints += 70;
        continue;
      }

      // Word overlap — require >50% of significant words to match
      const jobWords = jobSkill.split(/[\s,/\-']+/).filter((w) => w.length > 2);
      if (jobWords.length > 0) {
        const matchedWords = jobWords.filter((w) =>
          normalizedCv.some((cv) => cv === w || cv.includes(w))
        );
        const ratio = matchedWords.length / jobWords.length;
        if (ratio > 0.5) {
          totalPoints += Math.round(ratio * 60);
        }
      }
    }
    return Math.min(100, Math.round(totalPoints / normalizedJob.length));
  }

  // Strategy 2: No structured skills — search CV skills in job description text
  if (!jobDescription || jobDescription.length < 20) return -1;

  const descLower = jobDescription.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let found = 0;

  for (const skill of normalizedCv) {
    const skillNorm = skill.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (descLower.includes(skillNorm)) {
      found++;
      continue;
    }
    const words = skillNorm.split(/[\s,/\-']+/).filter((w) => w.length > 3);
    if (words.length > 0 && words.some((w) => descLower.includes(w))) {
      found++;
    }
  }

  return Math.round((found / normalizedCv.length) * 100);
}

export function calculateLanguageMatch(
  cvLanguages: Array<{ lang: string; level: string }>,
  jobLanguages: Array<{ language: string; level: string }>,
  jobDescription?: string
): number {
  if (!cvLanguages || cvLanguages.length === 0) return 0;

  const validJobLangs = (jobLanguages || []).filter(
    (l) => l && typeof l.language === "string" && l.language.length > 0
  );

  if (validJobLangs.length === 0) {
    if (!jobDescription) return -1;
    const descLower = jobDescription.toLowerCase();
    const langKeywords: Record<string, string[]> = {
      fr: ["francais", "français", "french", "langue maternelle"],
      de: ["allemand", "german", "deutsch"],
      en: ["anglais", "english", "englisch"],
      it: ["italien", "italian", "italiano"],
    };
    const requiredLangs: string[] = [];
    for (const [code, keywords] of Object.entries(langKeywords)) {
      if (keywords.some((kw) => descLower.includes(kw))) {
        requiredLangs.push(code);
      }
    }
    if (requiredLangs.length === 0) return -1;
    let matched = 0;
    for (const reqLang of requiredLangs) {
      if (cvLanguages.some((cv) => normalizeLanguageName(cv.lang) === reqLang)) {
        matched++;
      }
    }
    return Math.round((matched / requiredLangs.length) * 100);
  }

  let totalPoints = 0;

  for (const req of validJobLangs) {
    const reqLangNorm = normalizeLanguageName(req.language);
    const reqLevel = cefrToNumber(req.level);

    const cvMatch = cvLanguages.find(
      (cv) => normalizeLanguageName(cv.lang) === reqLangNorm
    );

    if (!cvMatch) continue;

    const cvLevel = cefrToNumber(cvMatch.level);

    // Both sides have no CEFR data → language present = partial credit only
    if (reqLevel === 0 && cvLevel === 0) {
      totalPoints += 60;
      continue;
    }

    // Job requires a level but CV has none → uncertain, partial credit
    if (reqLevel > 0 && cvLevel === 0) {
      totalPoints += 40;
      continue;
    }

    // CV has level but job doesn't specify → language present = full credit
    if (reqLevel === 0 && cvLevel > 0) {
      totalPoints += 100;
      continue;
    }

    // Both have levels → graduated scoring
    if (cvLevel >= reqLevel) {
      totalPoints += 100;
    } else {
      const gap = reqLevel - cvLevel;
      if (gap === 1) totalPoints += 65;
      else if (gap === 2) totalPoints += 30;
      // gap >= 3 → 0 points
    }
  }

  return Math.round(totalPoints / validJobLangs.length);
}

export function calculateSectorMatch(
  cvSectors: string[],
  jobCategories: Array<{ id?: number; name: string }>,
  jobTitle?: string,
  jobDescription?: string
): number {
  if (!cvSectors || cvSectors.length === 0) return -1;

  const normalizedCategories = (jobCategories || [])
    .filter((c) => c && typeof c.name === "string")
    .map((c) => c.name.toLowerCase().trim())
    .filter(Boolean);

  const searchText = [
    ...normalizedCategories,
    jobTitle?.toLowerCase() || "",
    (jobDescription || "").toLowerCase().substring(0, 2000),
  ].join(" ");

  if (searchText.trim().length < 10) return -1;

  let bestScore = 0;

  for (const sector of cvSectors) {
    if (!sector || typeof sector !== "string") continue;
    const sectorLower = sector.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Exact sector name match in categories
    if (normalizedCategories.some((cat) => cat.includes(sectorLower) || sectorLower.includes(cat))) {
      bestScore = Math.max(bestScore, 100);
      continue;
    }

    // Full sector name found in text
    if (searchText.includes(sectorLower)) {
      bestScore = Math.max(bestScore, 80);
      continue;
    }

    // Partial word match — proportional scoring
    const sectorWords = sectorLower.split(/[\s,/\-']+/).filter((w) => w.length > 3);
    if (sectorWords.length > 0) {
      const matchedWords = sectorWords.filter((w) => searchText.includes(w));
      const ratio = matchedWords.length / sectorWords.length;
      if (ratio > 0) {
        bestScore = Math.max(bestScore, Math.round(ratio * 60));
      }
    }
  }

  return bestScore;
}

export function calculateActivityRateMatch(
  preferredRate: number | null | undefined,
  jobRate: string | null | undefined
): number {
  if (preferredRate == null || !jobRate) return 100;

  const cleaned = jobRate.replace(/%/g, '').trim();

  const rangeMatch = cleaned.match(/(\d+)\s*[–\-—]\s*(\d+)/);

  let min: number;
  let max: number;

  if (rangeMatch) {
    min = parseInt(rangeMatch[1], 10);
    max = parseInt(rangeMatch[2], 10);
  } else {
    const singleMatch = cleaned.match(/(\d+)/);
    if (!singleMatch) return 100;
    const val = parseInt(singleMatch[1], 10);
    min = val;
    max = val;
  }

  if (preferredRate >= min && preferredRate <= max) return 100;

  // Graduated penalty based on distance
  const distance = preferredRate < min
    ? min - preferredRate
    : preferredRate - max;

  if (distance <= 10) return 80;
  if (distance <= 20) return 50;
  if (distance <= 30) return 25;
  return 0;
}

export function calculateSeniorityMatch(
  cvExperienceYears: number | undefined,
  jobTitle?: string,
  jobDescription?: string
): number {
  if (cvExperienceYears === undefined || cvExperienceYears < 0) return -1;

  const text = [jobTitle || "", (jobDescription || "").substring(0, 3000)].join(" ");
  const jobSeniority = inferSeniorityFromText(text);

  if (jobSeniority === null) return -1;

  const cvSeniority = experienceToSeniority(cvExperienceYears);
  const gap = Math.abs(cvSeniority - jobSeniority);

  if (gap === 0) return 100;
  if (gap === 1) return 75;
  if (gap === 2) return 40;
  return 10;
}

// =============================================================================
// Main scoring function
// =============================================================================

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
  const seniorityRaw = calculateSeniorityMatch(
    profile.experienceYears,
    job.title,
    job.description
  );

  // -1 means "no data available" — don't count this criterion
  const criteria: Array<{ value: number; weight: number; key: string }> = [];

  if (skillsRaw >= 0) criteria.push({ value: skillsRaw, weight: 0.40, key: "skills" });
  if (languagesRaw >= 0) criteria.push({ value: languagesRaw, weight: 0.20, key: "languages" });
  if (sectorRaw >= 0) criteria.push({ value: sectorRaw, weight: 0.15, key: "sector" });
  criteria.push({ value: activityRate, weight: 0.10, key: "activityRate" });
  if (seniorityRaw >= 0) criteria.push({ value: seniorityRaw, weight: 0.15, key: "seniority" });

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  let score = 0;
  for (const c of criteria) {
    score += c.value * (c.weight / totalWeight);
  }

  // Confidence based on how many criteria had data
  const availableCriteria = criteria.length;
  const confidence: 'high' | 'medium' | 'low' =
    availableCriteria >= 4 ? 'high' :
    availableCriteria >= 3 ? 'medium' : 'low';

  return {
    score: Math.round(score),
    confidence,
    breakdown: {
      skills: Math.max(0, skillsRaw),
      languages: Math.max(0, languagesRaw),
      sector: Math.max(0, sectorRaw),
      activityRate,
      seniority: Math.max(0, seniorityRaw),
    },
  };
}
