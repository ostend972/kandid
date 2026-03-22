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
  // Identity fields extracted from CV
  firstName?: string;
  lastName?: string;
  address?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  dateOfBirth?: string;
  civilStatus?: string;
  title?: string;
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
// Core analysis function — accepts multiple page images
// ---------------------------------------------------------------------------

export async function analyzeCv(
  pageImages: string | string[],
  jobDescription?: string
): Promise<CVFeedback> {
  const systemPrompt = buildCvAnalysisPrompt(jobDescription);

  // Support both single image (backward compat) and array of images
  const images = Array.isArray(pageImages) ? pageImages : [pageImages];

  // Build content array with all page images
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  for (let i = 0; i < images.length; i++) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${images[i]}`,
        detail: "high",
      },
    });
  }

  userContent.push({
    type: "text",
    text: images.length > 1
      ? `Ce CV contient ${images.length} pages. Analyse TOUTES les pages du CV selon les criteres ATS suisses. Chaque image ci-dessus correspond a une page. Retourne le JSON demande.`
      : "Analyse ce CV selon les criteres ATS suisses et retourne le JSON demande.",
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
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
  pageImages: string | string[],
  jobDescription?: string
): Promise<CVFeedback> {
  try {
    return await analyzeCv(pageImages, jobDescription);
  } catch (error) {
    console.error("CV analysis first attempt failed:", error);
    return await analyzeCv(pageImages, jobDescription);
  }
}
