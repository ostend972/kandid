import OpenAI from "openai";
import { buildCoverLetterPrompt } from "./prompts";
import { withRetry } from "./with-retry";

const openai = new OpenAI();

// =============================================================================
// Types
// =============================================================================

export interface GeneratedLetterData {
  subject: string;
  greeting: string;
  body: {
    vous: string;
    moi: string;
    nous: string;
  };
  closing: string;
  signature: string;
}

// =============================================================================
// Core generation function
// =============================================================================

export async function generateLetterData(
  profile: Record<string, unknown>,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string,
  instructions?: string
): Promise<{ data: GeneratedLetterData; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const systemPrompt = buildCoverLetterPrompt();

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

Redige la lettre de motivation au format JSON demande en utilisant la methode VOUS-MOI-NOUS.`;

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Reponse IA vide");

    const parsed = JSON.parse(content) as GeneratedLetterData;

    // Validate required fields
    if (!parsed.subject || !parsed.greeting || !parsed.body || !parsed.closing || !parsed.signature) {
      throw new Error("Format de reponse IA invalide : champs obligatoires manquants");
    }

    if (!parsed.body.vous || !parsed.body.moi || !parsed.body.nous) {
      throw new Error("Format de reponse IA invalide : structure VOUS-MOI-NOUS incomplete");
    }

    return {
      data: parsed,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  });
}
