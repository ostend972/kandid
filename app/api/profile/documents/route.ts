import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  uploadProfileDocument,
} from "@/lib/storage/cv-upload";
import {
  getCandidateDocuments,
  createCandidateDocument,
  countCandidateDocuments,
} from "@/lib/db/kandid-queries";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DOCS = 20;
const VALID_CATEGORIES = ["diploma", "certificate", "permit", "recommendation"];

// ---------------------------------------------------------------------------
// GET /api/profile/documents — list user documents
// ---------------------------------------------------------------------------

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorise." },
      { status: 401 }
    );
  }

  const documents = await getCandidateDocuments(user.id);
  return NextResponse.json({ documents });
}

// ---------------------------------------------------------------------------
// POST /api/profile/documents — upload a new document
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorise." },
      { status: 401 }
    );
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Requete invalide." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const category = formData.get("category") as string | null;
  const label = formData.get("label") as string | null;

  // Validate file
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier fourni." },
      { status: 400 }
    );
  }

  // Validate category
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "Categorie invalide." },
      { status: 400 }
    );
  }

  // Validate label
  if (!label || label.trim().length === 0) {
    return NextResponse.json(
      { error: "Le libelle est requis." },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Le fichier depasse la taille maximale de 10 Mo." },
      { status: 400 }
    );
  }

  // Validate PDF magic bytes
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const header = buffer.subarray(0, 5).toString("ascii");
  if (header !== "%PDF-") {
    return NextResponse.json(
      { error: "Seuls les fichiers PDF sont acceptes." },
      { status: 400 }
    );
  }

  // Check document count limit
  const docCount = await countCandidateDocuments(user.id);
  if (docCount >= MAX_DOCS) {
    return NextResponse.json(
      { error: `Nombre maximum de documents atteint (${MAX_DOCS}).` },
      { status: 400 }
    );
  }

  // Upload to Storage
  let storagePath: string;
  try {
    storagePath = await uploadProfileDocument(buffer, file.name, user.id);
  } catch (error) {
    console.error("Document upload failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du fichier." },
      { status: 500 }
    );
  }

  // Create DB row
  try {
    const document = await createCandidateDocument({
      userId: user.id,
      category,
      label: label.trim(),
      fileUrl: storagePath,
      fileName: file.name,
      fileSize: file.size,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Document DB insert failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde." },
      { status: 500 }
    );
  }
}
