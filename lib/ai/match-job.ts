import OpenAI from "openai";
import { buildJobMatchPrompt, buildStructuredMatchPrompt } from "./prompts";
import type { ExtractedProfile } from "./analyze-cv";

const openai = new OpenAI();

// =============================================================================
// Structured Match Types (v2 — 6-block analysis)
// =============================================================================

export interface BlockA {
  archetype: string;
  domain: string;
  function: string;
  seniority: string;
  remotePolicy: string;
  teamSize: string;
  tldr: string;
}

export interface BlockB {
  requirements: {
    requirement: string;
    status: "met" | "partial" | "not_met";
    explanation: string;
    suggestion: string;
    gapAnalysis: string;
    mitigationStrategy: string;
  }[];
}

export interface BlockC {
  detectedLevel: string;
  candidateLevel: string;
  alignment: "match" | "above" | "below";
  strategy: string;
}

export interface BlockD {
  salaryRange: {
    min: number;
    max: number;
    currency: string;
    canton: string;
  };
  thirteenthMonth: string;
  lppNote: string;
  cctReference: string;
  marketContext: string;
}

export interface BlockE {
  changes: {
    target: "cv" | "linkedin";
    section: string;
    currentState: string;
    recommendedChange: string;
    priority: "high" | "medium" | "low";
  }[];
}

export interface BlockF {
  stories: {
    requirement: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    reflection: string;
  }[];
}

export interface StructuredMatchResult {
  overallScore: number;
  verdict: "excellent" | "partial" | "low";
  matchVersion: 2;
  blocks: {
    a: BlockA | null;
    b: BlockB | null;
    c: BlockC | null;
    d: BlockD | null;
    e: BlockE | null;
    f: BlockF | null;
  };
}

// =============================================================================
// Structured result validation
// =============================================================================

const BLOCK_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

export function validateStructuredResult(parsed: unknown): StructuredMatchResult {
  const obj = parsed as Record<string, unknown>;

  const overallScore =
    typeof obj.overallScore === "number"
      ? Math.max(0, Math.min(100, Math.round(obj.overallScore)))
      : 50;

  const validVerdicts = ["excellent", "partial", "low"] as const;
  const verdict = validVerdicts.includes(obj.verdict as typeof validVerdicts[number])
    ? (obj.verdict as "excellent" | "partial" | "low")
    : overallScore >= 75
      ? "excellent"
      : overallScore >= 40
        ? "partial"
        : "low";

  const rawBlocks = (typeof obj.blocks === "object" && obj.blocks !== null ? obj.blocks : {}) as Record<string, unknown>;

  const missingBlocks: string[] = [];
  const blocks: Record<string, unknown> = {};
  for (const key of BLOCK_KEYS) {
    if (rawBlocks[key] && typeof rawBlocks[key] === "object") {
      blocks[key] = rawBlocks[key];
    } else {
      blocks[key] = null;
      missingBlocks.push(key.toUpperCase());
    }
  }

  if (missingBlocks.length > 0) {
    console.error(`[matchJobStructured] Missing/malformed blocks: ${missingBlocks.join(", ")}`);
  }

  return {
    overallScore,
    verdict,
    matchVersion: 2,
    blocks: blocks as StructuredMatchResult["blocks"],
  };
}

// =============================================================================
// Structured matching function (v2)
// =============================================================================

export async function matchJobStructured(
  profile: ExtractedProfile,
  job: {
    title: string;
    description: string;
    canton?: string;
    salary?: string;
    contractType?: string;
    company?: string;
    activityRate?: string;
    categories?: unknown;
    languageSkills?: unknown;
  }
): Promise<StructuredMatchResult> {
  const systemPrompt = buildStructuredMatchPrompt();

  const userMessage = `
PROFIL DU CANDIDAT:
${JSON.stringify(profile, null, 2)}

OFFRE D'EMPLOI:
${JSON.stringify(job, null, 2)}

Analyse le matching et retourne le JSON structuré en 6 blocs (A-F).
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 5000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Réponse IA vide");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Réponse IA non-JSON");
  }

  return validateStructuredResult(parsed);
}

// =============================================================================
// Structured matching with retry
// =============================================================================

export async function matchJobStructuredWithRetry(
  profile: ExtractedProfile,
  job: Parameters<typeof matchJobStructured>[1]
): Promise<StructuredMatchResult> {
  try {
    return await matchJobStructured(profile, job);
  } catch (error) {
    console.error("Structured match first attempt failed:", error);
    return await matchJobStructured(profile, job);
  }
}

// =============================================================================
// Types (v1 — flat match)
// =============================================================================

export interface JobMatchResult {
  overallScore: number;
  verdict: "excellent" | "partial" | "low";
  requirements: {
    requirement: string;
    status: "met" | "partial" | "not_met";
    explanation: string;
    suggestion?: string;
  }[];
}

// =============================================================================
// Core matching function
// =============================================================================

export async function matchJobWithAI(
  profile: ExtractedProfile,
  jobDescription: string,
  jobTitle: string
): Promise<JobMatchResult> {
  const systemPrompt = buildJobMatchPrompt();

  const userMessage = `
PROFIL DU CANDIDAT:
${JSON.stringify(profile, null, 2)}

TITRE DU POSTE: ${jobTitle}

DESCRIPTION DU POSTE:
${jobDescription}

Analyse la compatibilite et retourne le JSON demande.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 3000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Reponse IA vide");

  const parsed = JSON.parse(content) as JobMatchResult;

  // Validate required fields
  if (typeof parsed.overallScore !== "number" || !parsed.requirements) {
    throw new Error("Format de reponse IA invalide");
  }

  // Validate requirements array
  if (!Array.isArray(parsed.requirements) || parsed.requirements.length === 0) {
    throw new Error("Format de reponse IA invalide : aucune exigence extraite");
  }

  // Clamp score to 0-100
  parsed.overallScore = Math.max(0, Math.min(100, Math.round(parsed.overallScore)));

  // Determine verdict from score if not provided or invalid
  const validVerdicts = ["excellent", "partial", "low"];
  if (!parsed.verdict || !validVerdicts.includes(parsed.verdict)) {
    parsed.verdict =
      parsed.overallScore >= 75
        ? "excellent"
        : parsed.overallScore >= 40
          ? "partial"
          : "low";
  }

  // Validate each requirement
  for (const req of parsed.requirements) {
    if (!req.requirement || !req.status || !req.explanation) {
      throw new Error("Format de reponse IA invalide : exigence mal formee");
    }
    const validStatuses = ["met", "partial", "not_met"];
    if (!validStatuses.includes(req.status)) {
      req.status = "not_met";
    }
  }

  return parsed;
}

// =============================================================================
// Retry wrapper
// =============================================================================

export async function matchJobWithRetry(
  profile: ExtractedProfile,
  jobDescription: string,
  jobTitle: string
): Promise<JobMatchResult> {
  try {
    return await matchJobWithAI(profile, jobDescription, jobTitle);
  } catch (error) {
    console.error("Job match first attempt failed:", error);
    // One retry on failure
    return await matchJobWithAI(profile, jobDescription, jobTitle);
  }
}
