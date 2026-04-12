import OpenAI from "openai";
import { buildInterviewPrepPrompt } from "./prompts";
import type { ExtractedProfile } from "./analyze-cv";
import type { BlockF } from "./match-job";

const openai = new OpenAI();

// =============================================================================
// InterviewPrepData types
// =============================================================================

export interface InterviewPrepStory {
  requirement: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
  likelyQuestion: string;
}

export interface InterviewPrepQuestion {
  question: string;
  category: "technical" | "behavioral" | "role_specific" | "red_flag";
  why: string;
  suggestedAngle: string;
  mappedStory?: string;
}

export interface CompanySignals {
  values: string[];
  vocabularyToUse: string[];
  thingsToAvoid: string[];
  questionsToAsk: string[];
}

export interface TechnicalChecklistItem {
  topic: string;
  why: string;
  priority: "high" | "medium" | "low";
}

export interface SwissContext {
  salaryNegotiation: string;
  culturalNotes: string[];
  marketPosition: string;
}

export interface InterviewPrepData {
  version: 1;
  generatedAt: string;
  stories: InterviewPrepStory[];
  likelyQuestions: InterviewPrepQuestion[];
  companySignals: CompanySignals;
  technicalChecklist: TechnicalChecklistItem[];
  swissContext: SwissContext;
}

// =============================================================================
// Validation (graceful degradation — never throws on partial data)
// =============================================================================

const VALID_CATEGORIES = ["technical", "behavioral", "role_specific", "red_flag"] as const;
const VALID_PRIORITIES = ["high", "medium", "low"] as const;

export function validateInterviewPrepResult(parsed: unknown): InterviewPrepData {
  const obj = (typeof parsed === "object" && parsed !== null ? parsed : {}) as Record<string, unknown>;

  const missingBlocks: string[] = [];

  // stories
  let stories: InterviewPrepStory[] = [];
  if (Array.isArray(obj.stories)) {
    stories = obj.stories.map((s: Record<string, unknown>) => ({
      requirement: String(s?.requirement ?? ""),
      situation: String(s?.situation ?? ""),
      task: String(s?.task ?? ""),
      action: String(s?.action ?? ""),
      result: String(s?.result ?? ""),
      reflection: String(s?.reflection ?? ""),
      likelyQuestion: String(s?.likelyQuestion ?? ""),
    }));
  } else {
    missingBlocks.push("stories");
  }

  // likelyQuestions
  let likelyQuestions: InterviewPrepQuestion[] = [];
  if (Array.isArray(obj.likelyQuestions)) {
    likelyQuestions = obj.likelyQuestions.map((q: Record<string, unknown>) => {
      const cat = String(q?.category ?? "");
      return {
        question: String(q?.question ?? ""),
        category: (VALID_CATEGORIES.includes(cat as typeof VALID_CATEGORIES[number])
          ? cat
          : "behavioral") as InterviewPrepQuestion["category"],
        why: String(q?.why ?? ""),
        suggestedAngle: String(q?.suggestedAngle ?? ""),
        ...(q?.mappedStory ? { mappedStory: String(q.mappedStory) } : {}),
      };
    });
  } else {
    missingBlocks.push("likelyQuestions");
  }

  // companySignals
  let companySignals: CompanySignals = {
    values: [],
    vocabularyToUse: [],
    thingsToAvoid: [],
    questionsToAsk: [],
  };
  if (typeof obj.companySignals === "object" && obj.companySignals !== null) {
    const cs = obj.companySignals as Record<string, unknown>;
    companySignals = {
      values: Array.isArray(cs.values) ? cs.values.map(String) : [],
      vocabularyToUse: Array.isArray(cs.vocabularyToUse) ? cs.vocabularyToUse.map(String) : [],
      thingsToAvoid: Array.isArray(cs.thingsToAvoid) ? cs.thingsToAvoid.map(String) : [],
      questionsToAsk: Array.isArray(cs.questionsToAsk) ? cs.questionsToAsk.map(String) : [],
    };
  } else {
    missingBlocks.push("companySignals");
  }

  // technicalChecklist
  let technicalChecklist: TechnicalChecklistItem[] = [];
  if (Array.isArray(obj.technicalChecklist)) {
    technicalChecklist = obj.technicalChecklist.map((item: Record<string, unknown>) => {
      const prio = String(item?.priority ?? "");
      return {
        topic: String(item?.topic ?? ""),
        why: String(item?.why ?? ""),
        priority: (VALID_PRIORITIES.includes(prio as typeof VALID_PRIORITIES[number])
          ? prio
          : "medium") as TechnicalChecklistItem["priority"],
      };
    });
  } else {
    missingBlocks.push("technicalChecklist");
  }

  // swissContext
  let swissContext: SwissContext = {
    salaryNegotiation: "",
    culturalNotes: [],
    marketPosition: "",
  };
  if (typeof obj.swissContext === "object" && obj.swissContext !== null) {
    const sc = obj.swissContext as Record<string, unknown>;
    swissContext = {
      salaryNegotiation: String(sc.salaryNegotiation ?? ""),
      culturalNotes: Array.isArray(sc.culturalNotes) ? sc.culturalNotes.map(String) : [],
      marketPosition: String(sc.marketPosition ?? ""),
    };
  } else {
    missingBlocks.push("swissContext");
  }

  if (missingBlocks.length > 0) {
    console.error(`[validateInterviewPrepResult] Missing/malformed sections: ${missingBlocks.join(", ")}`);
  }

  return {
    version: 1,
    generatedAt: typeof obj.generatedAt === "string" ? obj.generatedAt : new Date().toISOString(),
    stories,
    likelyQuestions,
    companySignals,
    technicalChecklist,
    swissContext,
  };
}

// =============================================================================
// Generation function (follows matchJobStructured pattern)
// =============================================================================

export async function generateInterviewPrep(
  profile: ExtractedProfile,
  job: { title: string; description: string; company?: string; canton?: string },
  existingStories?: BlockF["stories"]
): Promise<InterviewPrepData> {
  const systemPrompt = buildInterviewPrepPrompt();

  const storiesSection = existingStories && existingStories.length > 0
    ? `\n\nSTORIES STAR+R EXISTANTES (issues du matching CV/offre — les enrichir et y ajouter le champ likelyQuestion) :\n${JSON.stringify(existingStories, null, 2)}`
    : "\n\nAucune story STAR+R existante — créer 3 à 5 stories à partir du profil et de l'offre.";

  const userMessage = `PROFIL DU CANDIDAT:
${JSON.stringify(profile, null, 2)}

OFFRE D'EMPLOI:
Titre: ${job.title}
Entreprise: ${job.company ?? "Non spécifiée"}
Canton: ${job.canton ?? "Non spécifié"}
Description:
${job.description}${storiesSection}

Génère le dossier de préparation d'entretien au format JSON.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 6000,
    temperature: 0.3,
    timeout: 60000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Réponse IA vide");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Réponse IA non-JSON");
  }

  return validateInterviewPrepResult(parsed);
}
