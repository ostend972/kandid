import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getJobMatch,
  getCvAnalysisById,
  getJobById,
  createJobMatch,
} from "@/lib/db/kandid-queries";
import { matchJobWithRetry } from "@/lib/ai/match-job";
import type { ExtractedProfile } from "@/lib/ai/analyze-cv";
import type { JobMatchResult } from "@/lib/ai/match-job";

// ---------------------------------------------------------------------------
// POST /api/match
// ---------------------------------------------------------------------------
// Body: { jobId: string, cvAnalysisId: string }
// Response: { id, overallScore, verdict, requirements[], cached }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ── 1. Authentication ──────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte pour analyser une offre." },
      { status: 401 }
    );
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────
  let body: { jobId?: string; cvAnalysisId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Requete invalide." },
      { status: 400 }
    );
  }

  const { jobId, cvAnalysisId } = body;

  if (!jobId || !cvAnalysisId) {
    return NextResponse.json(
      { error: "jobId et cvAnalysisId sont requis." },
      { status: 400 }
    );
  }

  // ── 3. Check cache ────────────────────────────────────────────────────
  try {
    const cachedMatch = await getJobMatch(cvAnalysisId, jobId);
    if (cachedMatch) {
      return NextResponse.json({
        id: cachedMatch.id,
        overallScore: cachedMatch.overallScore,
        verdict: cachedMatch.verdict,
        requirements: cachedMatch.requirements,
        cached: true,
      });
    }
  } catch (error) {
    console.error("Cache lookup failed:", error);
    // Continue without cache
  }

  // ── 4. Fetch CV analysis ──────────────────────────────────────────────
  const cvAnalysis = await getCvAnalysisById(cvAnalysisId);
  if (!cvAnalysis) {
    return NextResponse.json(
      { error: "Analyse CV introuvable." },
      { status: 404 }
    );
  }

  // Verify CV analysis belongs to the user
  if (cvAnalysis.userId !== userId) {
    return NextResponse.json(
      { error: "Acces non autorise a cette analyse CV." },
      { status: 403 }
    );
  }

  // ── 5. Fetch job ──────────────────────────────────────────────────────
  const job = await getJobById(jobId);
  if (!job) {
    return NextResponse.json(
      { error: "Offre d'emploi introuvable." },
      { status: 404 }
    );
  }

  // ── 6. Call AI matching ───────────────────────────────────────────────
  let matchResult: JobMatchResult;
  try {
    const profile = cvAnalysis.profile as unknown as ExtractedProfile;
    matchResult = await matchJobWithRetry(
      profile,
      job.description,
      job.title
    );
  } catch (error) {
    console.error("AI job matching failed after retry:", error);
    return NextResponse.json(
      {
        error:
          "L'analyse IA a echoue. Veuillez reessayer dans quelques instants.",
      },
      { status: 500 }
    );
  }

  // ── 7. Save to database ───────────────────────────────────────────────
  let savedMatch;
  try {
    savedMatch = await createJobMatch({
      userId,
      cvAnalysisId,
      jobId,
      overallScore: matchResult.overallScore,
      verdict: matchResult.verdict,
      requirements: matchResult.requirements as unknown as Record<string, unknown>,
    });
  } catch (error) {
    console.error("Job match DB save failed:", error);
    // Return the result anyway even if saving fails
    return NextResponse.json({
      id: null,
      overallScore: matchResult.overallScore,
      verdict: matchResult.verdict,
      requirements: matchResult.requirements,
      cached: false,
    });
  }

  // ── 8. Return result ──────────────────────────────────────────────────
  return NextResponse.json({
    id: savedMatch.id,
    overallScore: matchResult.overallScore,
    verdict: matchResult.verdict,
    requirements: matchResult.requirements,
    cached: false,
  });
}
