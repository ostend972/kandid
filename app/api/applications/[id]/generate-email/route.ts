import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationById,
  getCvAnalysisById,
  countTodayGenerations,
  logAiGeneration,
  updateApplication,
} from "@/lib/db/kandid-queries";
import { generateEmailData } from "@/lib/ai/generate-email";

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/generate-email — AI email generation
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

  // Get candidate name from CV profile
  let candidateName = "";
  if (application.cvAnalysisId) {
    const cvAnalysis = await getCvAnalysisById(application.cvAnalysisId);
    if (cvAnalysis?.profile) {
      const profile = cvAnalysis.profile as Record<string, unknown>;
      const identity = profile.identity as
        | Record<string, unknown>
        | undefined;
      if (identity) {
        const firstName = (identity.firstName as string) ?? "";
        const lastName = (identity.lastName as string) ?? "";
        candidateName = `${firstName} ${lastName}`.trim();
      }
    }
  }

  // Fallback to Clerk user name
  if (!candidateName) {
    candidateName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "Candidat";
  }

  try {
    const result = await generateEmailData(
      candidateName,
      application.jobTitle ?? "",
      application.jobCompany ?? ""
    );

    // Log generation
    await logAiGeneration(user.id, "email", application.id);

    // Save to application
    await updateApplication(id, user.id, {
      emailSubject: result.subject,
      emailBody: result.body,
    });

    return NextResponse.json({ emailData: result });
  } catch (error) {
    console.error("Email generation failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation de l'email." },
      { status: 500 }
    );
  }
}
