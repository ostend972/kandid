import OpenAI from "openai";
import { withRetry } from "./with-retry";
import { buildLinkedinCalendarPrompt } from "./prompts";
import {
  linkedinCalendarResultSchema,
  type LinkedinStructuredProfile,
  type LinkedinCalendarResult,
} from "@/lib/validations/linkedin";
import { logAiGeneration } from "@/lib/db/kandid-queries";

const openai = new OpenAI();

export async function generateEditorialCalendar(
  structured: LinkedinStructuredProfile,
  userId: string,
  userContext: {
    sector?: string | null;
    position?: string | null;
    strengths?: string[] | null;
    careerSummary?: string | null;
  }
): Promise<LinkedinCalendarResult> {
  const systemPrompt = buildLinkedinCalendarPrompt(userContext);

  const result = await withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Profil LinkedIn:\n${JSON.stringify(structured)}\n\nGenere le calendrier editorial sous forme de tableau JSON avec la cle "posts".`,
        },
      ],
      max_tokens: 8000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Reponse IA vide pour le calendrier editorial");
    }

    const parsed = JSON.parse(content);
    const postsArray = Array.isArray(parsed) ? parsed : parsed.posts;

    if (!Array.isArray(postsArray)) {
      throw new Error("Format de reponse IA invalide: tableau de posts attendu");
    }

    const truncated = postsArray.slice(0, 20);

    const validated = linkedinCalendarResultSchema.safeParse(truncated);
    if (!validated.success) {
      console.error("LinkedIn calendar validation failed:", validated.error.issues);
      throw new Error("Format de reponse IA invalide pour le calendrier editorial");
    }

    const usage = response.usage;
    if (usage) {
      logAiGeneration(userId, "linkedin_calendar", "", {
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
