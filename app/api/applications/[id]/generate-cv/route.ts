import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationById,
  getCvAnalysisById,
  countTodayGenerations,
  logAiGeneration,
  updateApplication,
} from "@/lib/db/kandid-queries";
import { generateCvData, IdentityContext } from "@/lib/ai/generate-cv";

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/generate-cv — AI CV generation
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
    // Extract identity fields from the CV analysis profile
    const profile = cvAnalysis.profile as Record<string, unknown>;

    const identityContext: IdentityContext = {
      firstName: (profile.firstName as string) || '',
      lastName: (profile.lastName as string) || '',
      address: (profile.address as string) || '',
      phone: (profile.phone as string) || '',
      email: (profile.email as string) || '',
      nationality: (profile.nationality as string) || '',
      dateOfBirth: (profile.dateOfBirth as string) || '',
      civilStatus: (profile.civilStatus as string) || '',
      title: (profile.title as string) || '',
    };

    // Fallback: get name from Clerk user if not in profile
    if (!identityContext.firstName && user?.firstName) {
      identityContext.firstName = user.firstName;
    }
    if (!identityContext.lastName && user?.lastName) {
      identityContext.lastName = user.lastName;
    }

    const result = await generateCvData(
      profile,
      application.jobTitle ?? "",
      application.jobCompany ?? "",
      application.jobDescription ?? "",
      instructions,
      identityContext
    );

    // Log generation
    await logAiGeneration(user.id, "cv", application.id);

    // Save to application
    await updateApplication(id, user.id, {
      generatedCvData: result as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ cvData: result });
  } catch (error) {
    console.error("CV generation failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du CV." },
      { status: 500 }
    );
  }
}
