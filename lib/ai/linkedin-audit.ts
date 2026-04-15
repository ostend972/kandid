import OpenAI from "openai";
import { withRetry } from "./with-retry";
import { buildLinkedinAuditPrompt } from "./prompts";
import {
  linkedinAuditResultSchema,
  type LinkedinStructuredProfile,
  type LinkedinAuditResult,
} from "@/lib/validations/linkedin";
import { logAiGeneration } from "@/lib/db/kandid-queries";

const openai = new OpenAI();

export async function auditLinkedinProfile(
  structured: LinkedinStructuredProfile,
  userId: string,
  userContext?: {
    sector?: string | null;
    position?: string | null;
    experienceLevel?: string | null;
  }
): Promise<LinkedinAuditResult> {
  const systemPrompt = buildLinkedinAuditPrompt(userContext);

  const result = await withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(structured) },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Reponse IA vide pour l'audit LinkedIn");
    }

    const parsed = JSON.parse(content);

    if (typeof parsed.score === "number" && parsed.score > 100) {
      parsed.score = 100;
    }

    const validated = linkedinAuditResultSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("LinkedIn audit validation failed:", validated.error.issues);
      throw new Error("Format de reponse IA invalide pour l'audit LinkedIn");
    }

    const usage = response.usage;
    if (usage) {
      logAiGeneration(userId, "linkedin_audit", "", {
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
