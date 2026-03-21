import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationsByUserId,
  countApplicationsByUser,
  getJobById,
  createApplication,
} from "@/lib/db/kandid-queries";

// ---------------------------------------------------------------------------
// GET /api/applications — list user applications (paginated)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));

  const result = await getApplicationsByUserId(user.id, page, limit);

  return NextResponse.json(result);
}

// ---------------------------------------------------------------------------
// POST /api/applications — create a new application
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }

  const { jobId, cvAnalysisId } = body as {
    jobId?: string;
    cvAnalysisId?: string;
  };

  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json(
      { error: "jobId est requis." },
      { status: 400 }
    );
  }

  // Check application limit
  const total = await countApplicationsByUser(user.id);
  if (total >= 50) {
    return NextResponse.json(
      { error: "Limite de 50 candidatures atteinte. Supprimez-en une avant d'en creer une nouvelle." },
      { status: 400 }
    );
  }

  // Fetch job for snapshot
  const job = await getJobById(jobId);
  if (!job) {
    return NextResponse.json(
      { error: "Offre non trouvee." },
      { status: 404 }
    );
  }

  const application = await createApplication({
    userId: user.id,
    jobId,
    cvAnalysisId: typeof cvAnalysisId === "string" ? cvAnalysisId : undefined,
    jobTitle: job.title,
    jobCompany: job.company,
    jobDescription: job.description,
  });

  return NextResponse.json({ application }, { status: 201 });
}
