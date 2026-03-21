import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { reorderCandidateDocuments } from "@/lib/db/kandid-queries";

// ---------------------------------------------------------------------------
// PATCH /api/profile/documents/reorder — reorder documents
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorise." },
      { status: 401 }
    );
  }

  let body: { orderedIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Requete invalide." },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(body.orderedIds) ||
    body.orderedIds.length === 0 ||
    !body.orderedIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json(
      { error: "Liste d'identifiants invalide." },
      { status: 400 }
    );
  }

  try {
    await reorderCandidateDocuments(user.id, body.orderedIds);
  } catch (error) {
    console.error("Document reorder failed:", error);
    return NextResponse.json(
      { error: "Erreur lors du reordonnement." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
