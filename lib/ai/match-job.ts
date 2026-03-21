import OpenAI from "openai";
import { buildJobMatchPrompt } from "./prompts";
import type { ExtractedProfile } from "./analyze-cv";

const openai = new OpenAI();

// =============================================================================
// Types
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
