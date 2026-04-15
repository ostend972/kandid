import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationById,
  updateApplication,
  transitionApplicationStatus,
} from "@/lib/db/kandid-queries";

// ---------------------------------------------------------------------------
// GET /api/applications/[id] — fetch a single application
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

  return NextResponse.json({ application });
}

// ---------------------------------------------------------------------------
// PATCH /api/applications/[id] — partial update
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Requete invalide." },
      { status: 400 }
    );
  }

  // Only allow known fields
  const allowedFields = [
    "cvAnalysisId",
    "jobTitle",
    "jobCompany",
    "jobDescription",
    "generatedCvUrl",
    "generatedCvData",
    "coverLetterUrl",
    "coverLetterText",
    "coverLetterInstructions",
    "emailSubject",
    "emailBody",
    "referencesPageUrl",
    "dossierUrl",
    "dossierMode",
    "status",
    "notes",
  ] as const;

  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      update[field] = body[field];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Aucune modification fournie." },
      { status: 400 }
    );
  }

  // Handle status transitions separately via the state machine
  const statusValue = update.status as string | undefined;
  delete update.status;

  let application;

  if (statusValue) {
    try {
      application = await transitionApplicationStatus(
        id,
        user.id,
        statusValue as Parameters<typeof transitionApplicationStatus>[2],
        'user'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur de transition";
      if (message.includes("non trouvée")) {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Apply remaining non-status updates if any
    if (Object.keys(update).length > 0) {
      application = await updateApplication(id, user.id, update);
    }
  } else {
    application = await updateApplication(id, user.id, update);
    if (!application) {
      return NextResponse.json(
        { error: "Candidature non trouvee." },
        { status: 404 }
      );
    }
  }

  return NextResponse.json({ application });
}
