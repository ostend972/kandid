import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getJobMatch,
  getCvAnalysisById,
  getJobById,
  createJobMatch,
} from "@/lib/db/kandid-queries";
import { matchJobWithRetry, matchJobStructured } from "@/lib/ai/match-job";
import type { ExtractedProfile } from "@/lib/ai/analyze-cv";
import type { JobMatchResult, StructuredMatchResult } from "@/lib/ai/match-job";

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
      const reqs = cachedMatch.requirements as Record<string, unknown> | null;
      const isV2 = reqs && typeof reqs === "object" && reqs.matchVersion === 2;

      if (isV2) {
        return NextResponse.json({
          id: cachedMatch.id,
          overallScore: cachedMatch.overallScore,
          verdict: cachedMatch.verdict,
          blocks: reqs.blocks,
          matchVersion: 2,
          cached: true,
        });
      }

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

  // ── 6. Call AI matching (v2 structured, with v1 fallback) ─────────────
  const profile = cvAnalysis.profile as unknown as ExtractedProfile;
  const jobContext = {
    title: job.title,
    description: job.description,
    canton: job.canton,
    salary: job.salary ?? undefined,
    contractType: job.contractType ?? undefined,
    company: job.company,
    activityRate: job.activityRate ?? undefined,
    categories: job.categories ?? undefined,
    languageSkills: job.languageSkills ?? undefined,
  };

  let structuredResult: StructuredMatchResult | null = null;
  let legacyResult: JobMatchResult | null = null;

  try {
    structuredResult = await matchJobStructured(profile, jobContext);
  } catch (firstError) {
    console.error("Structured match first attempt failed:", firstError);
    try {
      structuredResult = await matchJobStructured(profile, jobContext);
    } catch (secondError) {
      console.error("Structured match second attempt failed, falling back to v1:", secondError);
      try {
        legacyResult = await matchJobWithRetry(profile, job.description, job.title);
      } catch (legacyError) {
        console.error("AI job matching failed after all retries:", legacyError);
        return NextResponse.json(
          { error: "L'analyse IA a echoue. Veuillez reessayer dans quelques instants." },
          { status: 500 }
        );
      }
    }
  }

  // ── 7. Save to database ───────────────────────────────────────────────
  if (structuredResult) {
    const dbPayload = {
      matchVersion: 2 as const,
      blocks: structuredResult.blocks,
      overallScore: structuredResult.overallScore,
      verdict: structuredResult.verdict,
    };

    let savedMatch;
    try {
      savedMatch = await createJobMatch({
        userId,
        cvAnalysisId,
        jobId,
        overallScore: structuredResult.overallScore,
        verdict: structuredResult.verdict,
        requirements: dbPayload as unknown as Record<string, unknown>,
      });
    } catch (error) {
      console.error("Job match DB save failed:", error);
      return NextResponse.json({
        id: null,
        overallScore: structuredResult.overallScore,
        verdict: structuredResult.verdict,
        blocks: structuredResult.blocks,
        matchVersion: 2,
        cached: false,
      });
    }

    return NextResponse.json({
      id: savedMatch.id,
      overallScore: structuredResult.overallScore,
      verdict: structuredResult.verdict,
      blocks: structuredResult.blocks,
      matchVersion: 2,
      cached: false,
    });
  }

  // ── 8. Legacy v1 fallback result ──────────────────────────────────────
  let savedMatch;
  try {
    savedMatch = await createJobMatch({
      userId,
      cvAnalysisId,
      jobId,
      overallScore: legacyResult!.overallScore,
      verdict: legacyResult!.verdict,
      requirements: legacyResult!.requirements as unknown as Record<string, unknown>,
    });
  } catch (error) {
    console.error("Job match DB save failed:", error);
    return NextResponse.json({
      id: null,
      overallScore: legacyResult!.overallScore,
      verdict: legacyResult!.verdict,
      requirements: legacyResult!.requirements,
      cached: false,
    });
  }

  return NextResponse.json({
    id: savedMatch.id,
    overallScore: legacyResult!.overallScore,
    verdict: legacyResult!.verdict,
    requirements: legacyResult!.requirements,
    cached: false,
  });
}
