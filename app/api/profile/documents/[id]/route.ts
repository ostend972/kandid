import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { deleteProfileDocument } from "@/lib/storage/cv-upload";
import {
  updateCandidateDocument,
  deleteCandidateDocument,
} from "@/lib/db/kandid-queries";

const VALID_CATEGORIES = ["diploma", "certificate", "permit", "recommendation"];

// ---------------------------------------------------------------------------
// PATCH /api/profile/documents/[id] — update label, category, or sortOrder
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorise." },
      { status: 401 }
    );
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

  // Build update payload — only accept known fields
  const update: { label?: string; category?: string; sortOrder?: number } = {};

  if (typeof body.label === "string" && body.label.trim().length > 0) {
    update.label = body.label.trim();
  }

  if (typeof body.category === "string") {
    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: "Categorie invalide." },
        { status: 400 }
      );
    }
    update.category = body.category;
  }

  if (typeof body.sortOrder === "number") {
    update.sortOrder = body.sortOrder;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Aucune modification fournie." },
      { status: 400 }
    );
  }

  const document = await updateCandidateDocument(id, user.id, update);
  if (!document) {
    return NextResponse.json(
      { error: "Document non trouve." },
      { status: 404 }
    );
  }

  return NextResponse.json({ document });
}

// ---------------------------------------------------------------------------
// DELETE /api/profile/documents/[id] — delete document from DB + Storage
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorise." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const deleted = await deleteCandidateDocument(id, user.id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Document non trouve." },
      { status: 404 }
    );
  }

  // Delete file from Storage (non-blocking)
  try {
    if (deleted.fileUrl) {
      await deleteProfileDocument(deleted.fileUrl);
    }
  } catch (error) {
    console.error("Document storage delete failed:", error);
  }

  return NextResponse.json({ success: true });
}
