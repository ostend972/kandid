import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCvAnalysesByUserId } from "@/lib/db/kandid-queries";

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
