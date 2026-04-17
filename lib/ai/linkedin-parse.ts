import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import { withRetry } from "./with-retry";
import { buildLinkedinStructuringPrompt } from "./prompts";

const rootRequire = createRequire(path.join(process.cwd(), "package.json"));
const pdfParseEntry = rootRequire.resolve("pdf-parse");
const pdfParseRequire = createRequire(pdfParseEntry);
const pdfWorkerPath = pdfParseRequire.resolve(
  "pdfjs-dist/legacy/build/pdf.worker.mjs"
);
PDFParse.setWorker(pathToFileURL(pdfWorkerPath).href);
import {
  linkedinStructuredProfileSchema,
  type LinkedinStructuredProfile,
} from "@/lib/validations/linkedin";
import { logAiGeneration } from "@/lib/db/kandid-queries";

const openai = new OpenAI();

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } catch (error) {
    console.error("pdf-parse extraction failed:", {
      message: error instanceof Error ? error.message : String(error),
    });
    return "";
  } finally {
    await parser.destroy().catch(() => {});
  }
}

export async function structureLinkedinProfile(
  rawText: string,
  userId: string
): Promise<LinkedinStructuredProfile> {
  const systemPrompt = buildLinkedinStructuringPrompt();

  const result = await withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText },
      ],
      max_tokens: 4000,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Reponse IA vide pour le structuring LinkedIn");
    }

    const parsed = JSON.parse(content);
    const validated = linkedinStructuredProfileSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("LinkedIn structuring validation failed:", validated.error.issues);
      throw new Error("Format de reponse IA invalide pour LinkedIn");
    }

    const usage = response.usage;
    if (usage) {
      logAiGeneration(userId, "linkedin_structuring", null, {
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
