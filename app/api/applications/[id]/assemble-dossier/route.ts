import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationById,
  updateApplication,
  getCandidateDocumentsByCategory,
} from "@/lib/db/kandid-queries";
import {
  getApplicationFileBuffer,
  uploadApplicationPdf,
} from "@/lib/storage/cv-upload";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { assembleDossier } from "@/lib/pdf/assemble-dossier";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Helper: download a file from the profile-files bucket
// ---------------------------------------------------------------------------

async function getProfileFileBuffer(path: string): Promise<Buffer> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from("profile-files")
    .download(path);

  if (error) {
    throw new Error(`Profile file download failed: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/assemble-dossier
// Merges all application PDFs into a single dossier PDF.
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

  // -----------------------------------------------------------------------
  // Collect PDF buffers in strict order
  // -----------------------------------------------------------------------

  const pdfBuffers: Buffer[] = [];

  // 1. CV PDF — required
  if (!application.generatedCvUrl) {
    return NextResponse.json(
      { error: "Le CV genere est requis pour assembler le dossier." },
      { status: 400 }
    );
  }
  try {
    pdfBuffers.push(await getApplicationFileBuffer(application.generatedCvUrl));
  } catch (error) {
    console.error("Failed to download CV PDF:", error);
    return NextResponse.json(
      { error: "Impossible de telecharger le CV." },
      { status: 500 }
    );
  }

  // 2. Cover letter PDF — required
  if (!application.coverLetterUrl) {
    return NextResponse.json(
      { error: "La lettre de motivation est requise pour assembler le dossier." },
      { status: 400 }
    );
  }
  try {
    pdfBuffers.push(
      await getApplicationFileBuffer(application.coverLetterUrl)
    );
  } catch (error) {
    console.error("Failed to download cover letter PDF:", error);
    return NextResponse.json(
      { error: "Impossible de telecharger la lettre de motivation." },
      { status: 500 }
    );
  }

  // 3. References page — optional
  if (application.referencesPageUrl) {
    try {
      pdfBuffers.push(
        await getApplicationFileBuffer(application.referencesPageUrl)
      );
    } catch (error) {
      console.error("Failed to download references PDF (skipping):", error);
    }
  }

  // 4. User documents by category order:
  //    a. recommendation + certificate
  //    b. diploma
  //    c. permit
  const categoryOrder = [
    "recommendation",
    "certificate",
    "diploma",
    "permit",
  ] as const;

  for (const category of categoryOrder) {
    try {
      const docs = await getCandidateDocumentsByCategory(user.id, category);
      for (const doc of docs) {
        try {
          const buffer = await getProfileFileBuffer(doc.fileUrl);
          pdfBuffers.push(buffer);
        } catch (error) {
          console.error(
            `Failed to download ${category} document "${doc.label}" (skipping):`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        `Failed to fetch ${category} documents (skipping):`,
        error
      );
    }
  }

  // -----------------------------------------------------------------------
  // Assemble & upload
  // -----------------------------------------------------------------------

  let mergedBuffer: Buffer;
  try {
    mergedBuffer = await assembleDossier(pdfBuffers);
  } catch (error) {
    console.error("Dossier assembly failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'assemblage du dossier." },
      { status: 500 }
    );
  }

  let dossierPath: string;
  try {
    dossierPath = await uploadApplicationPdf(
      mergedBuffer,
      user.id,
      id,
      "dossier.pdf"
    );
  } catch (error) {
    console.error("Dossier upload failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du dossier." },
      { status: 500 }
    );
  }

  // Update application record
  try {
    await updateApplication(id, user.id, {
      dossierUrl: dossierPath,
      dossierMode: "single_pdf",
    });
  } catch (error) {
    console.error("Dossier DB update failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde." },
      { status: 500 }
    );
  }

  return NextResponse.json({ dossierUrl: dossierPath });
}
