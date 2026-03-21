import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCvAnalysisById, updateCvAnalysisResults } from "@/lib/db/kandid-queries";
import { getCVSignedUrl } from "@/lib/storage/cv-upload";
import { analyzeCvWithRetry } from "@/lib/ai/analyze-cv";

/**
 * POST /api/reanalyze-cv
 * Body: { analysisId: string }
 * Re-runs GPT-4o analysis on an existing CV using the current prompt.
 * Updates the same DB row (no duplicate created).
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { analysisId, allImagesBase64 } = body;

  if (!analysisId || typeof analysisId !== "string") {
    return NextResponse.json(
      { error: "ID d'analyse manquant." },
      { status: 400 }
    );
  }

  if (!allImagesBase64 || !Array.isArray(allImagesBase64) || allImagesBase64.length === 0) {
    return NextResponse.json(
      { error: "Images du CV manquantes." },
      { status: 400 }
    );
  }

  // Verify analysis exists and belongs to user
  const analysis = await getCvAnalysisById(analysisId);
  if (!analysis || analysis.userId !== userId) {
    return NextResponse.json(
      { error: "Analyse non trouvee." },
      { status: 404 }
    );
  }

  // Re-run AI analysis with current prompt
  let feedback;
  try {
    feedback = await analyzeCvWithRetry(allImagesBase64);
  } catch (error) {
    console.error("Re-analysis failed:", error);
    return NextResponse.json(
      { error: "L'analyse IA a echoue. Veuillez reessayer." },
      { status: 500 }
    );
  }

  // Update the same DB row
  const updated = await updateCvAnalysisResults(analysisId, userId, {
    overallScore: feedback.overallScore,
    profile: feedback.profile as unknown as Record<string, unknown>,
    feedback: feedback.categories as unknown as Record<string, unknown>,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    overallScore: feedback.overallScore,
    success: true,
  });
}
