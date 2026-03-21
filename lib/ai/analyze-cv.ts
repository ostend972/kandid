import OpenAI from "openai";
import { buildCvAnalysisPrompt } from "./prompts";

const openai = new OpenAI();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CVFeedback {
  overallScore: number;
  profile: ExtractedProfile;
  categories: {
    ats: CategoryFeedback;
    swissAdaptation: CategoryFeedback;
    content: CategoryFeedback;
    structure: CategoryFeedback;
    skills: CategoryFeedback;
  };
}

export interface ExtractedProfile {
  skills: string[];
  languages: { lang: string; level: string }[];
  experienceYears: number;
  sectors: string[];
  educationLevel: string;
  educationDetails: string;
  swissEquivalence: string;
  hasPhoto: boolean;
  hasNationality: boolean;
  hasPermit: string | null;
  hasReferencesMention: boolean;
}

export interface CategoryFeedback {
  score: number;
  tips: {
    type: "good" | "improve" | "critical";
    title: string;
    explanation: string;
    suggestion?: string;
  }[];
}

// ---------------------------------------------------------------------------
// Core analysis function
// ---------------------------------------------------------------------------

export async function analyzeCv(
  imageBase64: string,
  jobDescription?: string
): Promise<CVFeedback> {
  const systemPrompt = buildCvAnalysisPrompt(jobDescription);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${imageBase64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Analyse ce CV selon les criteres ATS suisses et retourne le JSON demande.",
          },
        ],
      },
    ],
    max_tokens: 4000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Reponse IA vide");
  }

  const parsed = JSON.parse(content) as CVFeedback;

  // Validate required top-level fields
  if (
    typeof parsed.overallScore !== "number" ||
    !parsed.profile ||
    !parsed.categories
  ) {
    throw new Error("Format de reponse IA invalide");
  }

  // Validate category keys exist
  const requiredCategories = [
    "ats",
    "swissAdaptation",
    "content",
    "structure",
    "skills",
  ] as const;
  for (const cat of requiredCategories) {
    if (
      !parsed.categories[cat] ||
      typeof parsed.categories[cat].score !== "number" ||
      !Array.isArray(parsed.categories[cat].tips)
    ) {
      throw new Error(
        `Format de reponse IA invalide : categorie "${cat}" manquante ou mal formee`
      );
    }
  }

  // Clamp overallScore to 0-100
  parsed.overallScore = Math.max(0, Math.min(100, Math.round(parsed.overallScore)));

  return parsed;
}

// ---------------------------------------------------------------------------
// Retry wrapper
// ---------------------------------------------------------------------------

export async function analyzeCvWithRetry(
  imageBase64: string,
  jobDescription?: string
): Promise<CVFeedback> {
  try {
    return await analyzeCv(imageBase64, jobDescription);
  } catch (error) {
    // One retry on failure
    console.error("CV analysis first attempt failed:", error);
    return await analyzeCv(imageBase64, jobDescription);
  }
}
