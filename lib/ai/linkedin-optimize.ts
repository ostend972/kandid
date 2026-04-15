import OpenAI from "openai";
import { withRetry } from "./with-retry";
import { buildLinkedinOptimizePrompt } from "./prompts";
import {
  linkedinOptimizeResultSchema,
  type LinkedinStructuredProfile,
  type LinkedinOptimizeResult,
} from "@/lib/validations/linkedin";
import { logAiGeneration } from "@/lib/db/kandid-queries";

const openai = new OpenAI();

export async function optimizeLinkedinHeadline(
  structured: LinkedinStructuredProfile,
  userId: string,
  userContext: {
    sector?: string | null;
    position?: string | null;
    experienceLevel?: string | null;
    careerSummary?: string | null;
    strengths?: string[] | null;
  }
): Promise<LinkedinOptimizeResult> {
  const systemPrompt = buildLinkedinOptimizePrompt(userContext);

  const result = await withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(structured) },
      ],
      max_tokens: 3000,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Reponse IA vide pour l'optimisation LinkedIn");
    }

    const parsed = JSON.parse(content);
    const validated = linkedinOptimizeResultSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("LinkedIn optimize validation failed:", validated.error.issues);
      throw new Error("Format de reponse IA invalide pour l'optimisation LinkedIn");
    }

    const usage = response.usage;
    if (usage) {
      logAiGeneration(userId, "linkedin_optimize", "", {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      }).catch((err) =>
        console.error("Failed to log AI generation:", err)
      );
    }

    return validated.data;
  }, 1);

  return result;
}
