import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getApplicationById, updateApplication } from "@/lib/db/kandid-queries";
import { uploadApplicationPdf } from "@/lib/storage/cv-upload";

const VALID_TYPES = ["cv", "letter", "references"] as const;
type PdfType = (typeof VALID_TYPES)[number];

const FILE_NAME_MAP: Record<PdfType, string> = {
  cv: "cv.pdf",
  letter: "lettre.pdf",
  references: "references.pdf",
};

const URL_COLUMN_MAP: Record<PdfType, "generatedCvUrl" | "coverLetterUrl" | "referencesPageUrl"> = {
  cv: "generatedCvUrl",
  letter: "coverLetterUrl",
  references: "referencesPageUrl",
};

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/upload-pdf — upload a generated PDF
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Requete invalide." },
      { status: 400 }
    );
  }

  // Validate type
  const type = formData.get("type") as string | null;
  if (!type || !VALID_TYPES.includes(type as PdfType)) {
    return NextResponse.json(
      { error: "Type invalide. Valeurs acceptees : cv, letter, references." },
      { status: 400 }
    );
  }

  // Validate file
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier fourni." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Le fichier depasse la taille maximale de 50 Mo." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
  if (buffer.length < 4 || !buffer.subarray(0, 4).equals(PDF_MAGIC)) {
    return NextResponse.json(
      { error: "Le fichier n'est pas un PDF valide." },
      { status: 400 }
    );
  }

  // Ownership check
  const application = await getApplicationById(id, user.id);
  if (!application) {
    return NextResponse.json(
      { error: "Candidature non trouvee." },
      { status: 404 }
    );
  }
  const pdfType = type as PdfType;

  let path: string;
  try {
    path = await uploadApplicationPdf(
      buffer,
      user.id,
      id,
      FILE_NAME_MAP[pdfType]
    );
  } catch (error) {
    console.error("Application PDF upload failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du fichier." },
      { status: 500 }
    );
  }

  // Update the appropriate URL column
  try {
    await updateApplication(id, user.id, {
      [URL_COLUMN_MAP[pdfType]]: path,
    });
  } catch (error) {
    console.error("Application PDF DB update failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde." },
      { status: 500 }
    );
  }

  return NextResponse.json({ path });
}
