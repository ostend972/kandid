import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { PassThrough } from "stream";
import {
  getApplicationById,
  getCandidateDocumentsByCategory,
} from "@/lib/db/kandid-queries";
import {
  getApplicationFileBuffer,
  getApplicationSignedUrl,
} from "@/lib/storage/cv-upload";
import { getSupabaseAdmin } from "@/lib/supabase/client";

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
// Helper: sanitize a string for use in file names
// ---------------------------------------------------------------------------

function sanitize(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ _-]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 80);
}

// ---------------------------------------------------------------------------
// GET /api/applications/[id]/download?mode=pdf|zip
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
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

  const mode = request.nextUrl.searchParams.get("mode") || "pdf";

  // =========================================================================
  // PDF mode — redirect to signed URL for the assembled dossier
  // =========================================================================

  if (mode === "pdf") {
    if (!application.dossierUrl) {
      return NextResponse.json(
        { error: "Le dossier n'a pas encore ete assemble." },
        { status: 400 }
      );
    }

    const signedUrl = await getApplicationSignedUrl(application.dossierUrl);
    if (!signedUrl) {
      return NextResponse.json(
        { error: "Impossible de generer le lien de telechargement." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signedUrl);
  }

  if (mode === "cv") {
    if (!application.generatedCvUrl) {
      return NextResponse.json(
        { error: "Le CV adapte n'a pas encore ete genere." },
        { status: 400 }
      );
    }

    const signedUrl = await getApplicationSignedUrl(application.generatedCvUrl);
    if (!signedUrl) {
      return NextResponse.json(
        { error: "Impossible de generer le lien de telechargement." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signedUrl);
  }

  // =========================================================================
  // ZIP mode — stream a ZIP archive with all individual files
  // =========================================================================

  if (mode === "zip") {
    const nom = sanitize(application.jobCompany ? application.jobTitle || "Poste" : "Candidature");
    const entreprise = sanitize(application.jobCompany || "Entreprise");
    const candidatName = sanitize(
      user.fullName || user.firstName || "Candidat"
    );

    // Create archive
    const archive = archiver("zip", { zlib: { level: 6 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    // 1. CV
    if (application.generatedCvUrl) {
      try {
        const buffer = await getApplicationFileBuffer(
          application.generatedCvUrl
        );
        archive.append(buffer, {
          name: `CV_${candidatName}_${nom}.pdf`,
        });
      } catch (error) {
        console.error("Failed to add CV to ZIP:", error);
      }
    }

    // 2. Cover letter
    if (application.coverLetterUrl) {
      try {
        const buffer = await getApplicationFileBuffer(
          application.coverLetterUrl
        );
        archive.append(buffer, {
          name: `Lettre_${candidatName}_${entreprise}.pdf`,
        });
      } catch (error) {
        console.error("Failed to add cover letter to ZIP:", error);
      }
    }

    // 3. References
    if (application.referencesPageUrl) {
      try {
        const buffer = await getApplicationFileBuffer(
          application.referencesPageUrl
        );
        archive.append(buffer, {
          name: `References_${candidatName}.pdf`,
        });
      } catch (error) {
        console.error("Failed to add references to ZIP:", error);
      }
    }

    // 4. User documents (recommendation, certificate, diploma, permit)
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
            const ext = doc.fileName.endsWith(".pdf") ? "" : ".pdf";
            archive.append(buffer, {
              name: `${sanitize(doc.label)}${ext}`,
            });
          } catch (error) {
            console.error(
              `Failed to add ${category} doc "${doc.label}" to ZIP:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${category} documents:`, error);
      }
    }

    // Finalize archive
    archive.finalize();

    // Convert Node.js stream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        passthrough.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        passthrough.on("end", () => {
          controller.close();
        });
        passthrough.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    const zipFileName = `Dossier_${candidatName}_${entreprise}.zip`;

    return new Response(readableStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
      },
    });
  }

  return NextResponse.json(
    { error: "Mode invalide. Valeurs acceptees : pdf, cv, zip." },
    { status: 400 }
  );
}
