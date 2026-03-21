import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationById,
  getCvAnalysisById,
  countTodayGenerations,
  logAiGeneration,
  updateApplication,
} from "@/lib/db/kandid-queries";
import { generateLetterData } from "@/lib/ai/generate-letter";

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/generate-letter — AI cover letter generation
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  // Ownership check
  const application = await getApplicationById(id, user.id);
  if (!application) {
    return NextResponse.json(
      { error: "Candidature non trouvee." },
      { status: 404 }
    );
  }

  // Rate limit
  const todayCount = await countTodayGenerations(user.id);
  if (todayCount >= 10) {
    return NextResponse.json(
      {
        error:
          "Limite quotidienne atteinte (10 generations/jour). Reessayez demain.",
      },
      { status: 429 }
    );
  }

  // Get CV analysis for profile data
  if (!application.cvAnalysisId) {
    return NextResponse.json(
      { error: "Aucun CV associe a cette candidature." },
      { status: 400 }
    );
  }

  const cvAnalysis = await getCvAnalysisById(application.cvAnalysisId);
  if (!cvAnalysis) {
    return NextResponse.json(
      { error: "Analyse CV non trouvee." },
      { status: 404 }
    );
  }

  // Parse optional instructions
  let instructions: string | undefined;
  try {
    const body = await request.json();
    if (typeof body.instructions === "string" && body.instructions.trim()) {
      instructions = body.instructions.trim();
    }
  } catch {
    // No body or invalid JSON — proceed without instructions
  }

  try {
    const result = await generateLetterData(
      cvAnalysis.profile as Record<string, unknown>,
      application.jobTitle ?? "",
      application.jobCompany ?? "",
      application.jobDescription ?? "",
      instructions
    );

    // Log generation
    await logAiGeneration(user.id, "letter", application.id);

    // Assemble full text from structured data
    const fullText = [
      result.greeting,
      "",
      result.body.vous,
      "",
      result.body.moi,
      "",
      result.body.nous,
      "",
      result.closing,
      result.signature,
    ].join("\n");

    // Save to application
    await updateApplication(id, user.id, {
      coverLetterText: fullText,
      coverLetterInstructions: instructions ?? null,
    });

    return NextResponse.json({ letterData: result });
  } catch (error) {
    console.error("Letter generation failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation de la lettre." },
      { status: 500 }
    );
  }
}
