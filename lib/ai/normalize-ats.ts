import type { GeneratedCvData } from "./generate-cv";

// =============================================================================
// ATS-safe unicode normalization
// =============================================================================

const ATS_REPLACEMENTS: [RegExp, string][] = [
  [/[\u2014]/g, "-"],         // em-dash → hyphen
  [/[\u2013]/g, "-"],         // en-dash → hyphen
  [/[\u201C\u201D\u201E\u201F]/g, '"'], // smart double quotes → straight
  [/[\u2018\u2019\u201A\u201B]/g, "'"], // smart single quotes → apostrophe
  [/[\u2026]/g, "..."],       // ellipsis → three dots
  [/[\u200B\u200C\u200D\u2060\uFEFF]/g, ""], // zero-width chars → empty
  [/[\u00A0]/g, " "],         // nbsp → space
];

export function normalizeForATS(text: string): string {
  let result = text;
  for (const [pattern, replacement] of ATS_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// =============================================================================
// Deep-walk all string fields of GeneratedCvData
// =============================================================================

function normalizeValue(value: unknown): unknown {
  if (typeof value === "string") return normalizeForATS(value);
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalizeValue(v);
    }
    return out;
  }
  return value;
}

export function normalizeGeneratedCv(data: GeneratedCvData): GeneratedCvData {
  return normalizeValue(data) as GeneratedCvData;
}

// =============================================================================
// Extract ATS keywords from job description (pure string processing)
// =============================================================================

const STOPWORDS = new Set([
  // French
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "au", "aux",
  "pour", "par", "sur", "dans", "avec", "est", "sont", "a", "ou", "ce", "cette",
  "ces", "que", "qui", "nous", "vous", "ils", "elles", "son", "ses", "nos", "vos",
  "leur", "leurs", "plus", "pas", "ne", "se", "si", "tout", "tous", "toute",
  "toutes", "votre", "notre", "etre", "avoir", "faire", "comme", "mais", "bien",
  "aussi", "entre", "tres", "peut", "dont", "elle", "il", "je", "tu", "mon",
  "ma", "mes", "ton", "ta", "tes", "lui", "eux", "moi", "toi", "soi",
  // English
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "shall", "should", "may", "might",
  "can", "could", "must", "not", "no", "so", "if", "it", "its", "we", "you",
  "they", "them", "their", "this", "that", "these", "those", "from", "as", "up",
  "our", "your", "he", "she", "his", "her", "my", "me", "us", "all", "each",
  "any", "some", "about", "into", "through", "during", "before", "after", "above",
  "below", "between", "under", "over", "out", "off", "then", "than", "too",
  "very", "just", "also", "own", "same", "other", "such", "only", "both",
]);

export function extractATSKeywords(jobDescription: string): string[] {
  if (!jobDescription) return [];

  const lines = jobDescription.split(/[\n\r]+/);
  const phrases: string[] = [];

  for (const line of lines) {
    const segments = line.split(/[,;•·\-–—|\/\\]+/);
    for (const seg of segments) {
      const trimmed = seg.trim();
      if (trimmed.length >= 2) {
        phrases.push(trimmed);
      }
    }
  }

  const freqMap = new Map<string, { original: string; count: number; firstPos: number }>();

  for (let i = 0; i < phrases.length; i++) {
    const words = phrases[i]
      .replace(/[()[\]{}:."'!?]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !STOPWORDS.has(w.toLowerCase()));

    // Single words and 2-3 word phrases
    const candidates: string[] = [];
    for (const w of words) candidates.push(w);
    for (let j = 0; j < words.length - 1; j++) {
      candidates.push(`${words[j]} ${words[j + 1]}`);
      if (j < words.length - 2) {
        candidates.push(`${words[j]} ${words[j + 1]} ${words[j + 2]}`);
      }
    }

    for (const c of candidates) {
      const key = c.toLowerCase();
      const existing = freqMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        freqMap.set(key, { original: c, count: 1, firstPos: i });
      }
    }
  }

  // Score: frequency + earlier position bonus, prefer multi-word
  const scored = [...freqMap.entries()]
    .filter(([key]) => key.length >= 3)
    .map(([key, { original, count, firstPos }]) => {
      const wordCount = key.split(" ").length;
      const multiWordBonus = wordCount >= 2 ? 2 : 0;
      const positionBonus = Math.max(0, 1 - firstPos / phrases.length);
      const score = count + multiWordBonus + positionBonus;
      return { key, original, score };
    })
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const { key, original } of scored) {
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(original);
    if (result.length >= 20) break;
  }

  return result;
}
