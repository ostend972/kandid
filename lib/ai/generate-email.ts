import OpenAI from "openai";
import { buildEmailPrompt } from "./prompts";
import { withRetry } from "./with-retry";

const openai = new OpenAI();

// =============================================================================
// Types
// =============================================================================

export interface GeneratedEmailData {
  subject: string;
  body: string;
}

// =============================================================================
// Core generation function
// =============================================================================

export async function generateEmailData(
  candidateName: string,
  jobTitle: string,
  jobCompany: string
): Promise<{ data: GeneratedEmailData; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const systemPrompt = buildEmailPrompt();

  const userMessage = `NOM DU CANDIDAT: ${candidateName}
POSTE CIBLE: ${jobTitle}
ENTREPRISE: ${jobCompany}

Redige l'email d'accompagnement de candidature au format JSON demande.`;

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Reponse IA vide");

    const parsed = JSON.parse(content) as GeneratedEmailData;

    // Validate required fields
    if (!parsed.subject || !parsed.body) {
      throw new Error("Format de reponse IA invalide : subject ou body manquant");
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
