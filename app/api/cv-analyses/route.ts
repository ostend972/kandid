import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCvAnalysesByUserId, deleteCvAnalysis } from "@/lib/db/kandid-queries";
import { deleteCV } from "@/lib/storage/cv-upload";

/**
 * GET /api/cv-analyses
 * Returns the current user's CV analysis history (id, fileName, score, date).
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const analyses = await getCvAnalysesByUserId(userId);

  return NextResponse.json({
    analyses: analyses.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      overallScore: a.overallScore,
      createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  });
}

/**
 * DELETE /api/cv-analyses
 * Body: { id: string }
 * Deletes a CV analysis, its files from Storage, and updates active CV if needed.
 */
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID manquant." }, { status: 400 });
  }

  const deleted = await deleteCvAnalysis(id, userId);
  if (!deleted) {
    return NextResponse.json({ error: "Analyse non trouvee." }, { status: 404 });
  }

  // Delete files from Supabase Storage (non-blocking)
  try {
    if (deleted.fileUrl) await deleteCV(deleted.fileUrl);
    if (deleted.imageUrl) await deleteCV(deleted.imageUrl);
  } catch (error) {
    console.error("Failed to delete CV files from storage:", error);
  }

  return NextResponse.json({ success: true });
}
