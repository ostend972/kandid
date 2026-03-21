import OpenAI from "openai";
import { buildCvGenerationPrompt } from "./prompts";
import { withRetry } from "./with-retry";

const openai = new OpenAI();

// =============================================================================
// Types
// =============================================================================

export interface GeneratedCvData {
  identity: {
    firstName: string;
    lastName: string;
    title: string;
    address: string;
    phone: string;
    email: string;
    nationality: string;
    dateOfBirth: string;
    civilStatus: string;
  };
  experiences: {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    contractType: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    equivalence: string;
    institution: string;
    location: string;
    year: string;
    details?: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  languages: {
    language: string;
    level: string;
  }[];
  interests: string[];
}

// =============================================================================
// Core generation function
// =============================================================================

export async function generateCvData(
  profile: Record<string, unknown>,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string,
  instructions?: string
): Promise<GeneratedCvData> {
  const systemPrompt = buildCvGenerationPrompt();

  let userMessage = `PROFIL DU CANDIDAT:
${JSON.stringify(profile, null, 2)}

POSTE CIBLE: ${jobTitle}
ENTREPRISE: ${jobCompany}

DESCRIPTION DU POSTE:
${jobDescription}`;

  if (instructions) {
    userMessage += `

INSTRUCTIONS SUPPLEMENTAIRES DU CANDIDAT:
${instructions}`;
  }

  userMessage += `

Genere le CV suisse optimise au format JSON demande.`;

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Reponse IA vide");

    const parsed = JSON.parse(content) as GeneratedCvData;

    // Validate required fields
    if (!parsed.identity || !parsed.experiences || !parsed.education) {
      throw new Error("Format de reponse IA invalide : champs obligatoires manquants");
    }

    if (!parsed.identity.firstName || !parsed.identity.lastName) {
      throw new Error("Format de reponse IA invalide : identite incomplete");
    }

    if (!Array.isArray(parsed.experiences) || parsed.experiences.length === 0) {
      throw new Error("Format de reponse IA invalide : aucune experience generee");
    }

    return parsed;
  });
}
