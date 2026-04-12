import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationById,
  getApplicationWithContext,
  saveInterviewPrep,
} from "@/lib/db/kandid-queries";
import { generateInterviewPrep } from "@/lib/ai/interview-prep";
import type { StructuredMatchResult } from "@/lib/ai/match-job";

// ---------------------------------------------------------------------------
// GET /api/applications/[id]/interview-prep — retrieve stored prep data
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  const application = await getApplicationById(id, user.id);
  if (!application) {
    return NextResponse.json(
      { error: "Candidature non trouvee." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    interviewPrep: application.interviewPrep ?? null,
    generatedAt: application.interviewPrepGeneratedAt?.toISOString() ?? null,
  });
}

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/interview-prep — generate and store prep
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  const context = await getApplicationWithContext(id, user.id);
  if (!context) {
    return NextResponse.json(
      { error: "Candidature non trouvee." },
      { status: 404 }
    );
  }

  const { application, cvAnalysis, job, cachedMatch } = context;

  if (!application.jobDescription) {
    return NextResponse.json(
      { error: "La candidature n'a pas de description de poste." },
      { status: 400 }
    );
  }

  const profile = cvAnalysis?.profile as
    | Parameters<typeof generateInterviewPrep>[0]
    | undefined;

  if (!profile) {
    return NextResponse.json(
      { error: "Aucun profil CV associe a cette candidature." },
      { status: 400 }
    );
  }

  // Extract BlockF stories from cached v2 match if available
  let existingStories: Parameters<typeof generateInterviewPrep>[2];
  if (cachedMatch) {
    const reqs = cachedMatch.requirements as unknown as StructuredMatchResult | null;
    if (reqs && reqs.matchVersion === 2 && reqs.blocks?.f?.stories) {
      existingStories = reqs.blocks.f.stories;
    }
  }

  const jobContext = {
    title: application.jobTitle ?? job?.title ?? "Non specifie",
    description: application.jobDescription,
    company: application.jobCompany ?? job?.company,
    canton: job?.canton,
  };

  try {
    const result = await generateInterviewPrep(
      profile,
      jobContext,
      existingStories
    );

    await saveInterviewPrep(id, user.id, result);

    return NextResponse.json({
      interviewPrep: result,
      generatedAt: result.generatedAt,
    });
  } catch (error) {
    console.error("generateInterviewPrep() failed:", error);
    return NextResponse.json(
      { error: "Echec de la generation du dossier de preparation" },
      { status: 500 }
    );
  }
}
