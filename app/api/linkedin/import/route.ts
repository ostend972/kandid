import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { validatePdfBuffer, MAX_FILE_SIZE } from "@/lib/file-validation";
import { uploadLinkedinPdf } from "@/lib/storage/cv-upload";
import {
  extractTextFromPdf,
  structureLinkedinProfile,
} from "@/lib/ai/linkedin-parse";
import { upsertLinkedinProfile } from "@/lib/db/kandid-queries";

const MAX_PASTE_LENGTH = 10_000;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte pour importer votre profil LinkedIn." },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Requete invalide. Envoyez un formulaire multipart." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const pastedText = formData.get("pastedText");

  const hasFile = file instanceof File && file.size > 0;
  const hasPaste =
    typeof pastedText === "string" && pastedText.trim().length > 0;

  if (!hasFile && !hasPaste) {
    return NextResponse.json(
      { error: "Veuillez fournir un fichier PDF ou coller le texte de votre profil." },
      { status: 400 }
    );
  }

  let rawText = "";
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let source: "pdf" | "paste";

  if (hasFile) {
    source = "pdf";
    fileName = file.name;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Seuls les fichiers PDF sont acceptes." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le fichier depasse la taille maximale de 10 Mo." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bufferValidation = validatePdfBuffer(buffer);
    if (!bufferValidation.valid) {
      return NextResponse.json(
        { error: bufferValidation.error },
        { status: 400 }
      );
    }

    try {
      fileUrl = await uploadLinkedinPdf(buffer, file.name, userId);
    } catch (error) {
      console.error("LinkedIn PDF upload failed:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi du fichier. Veuillez reessayer." },
        { status: 500 }
      );
    }

    rawText = await extractTextFromPdf(buffer);
    if (!rawText.trim()) {
      rawText =
        "Extraction PDF echouee — le fichier ne contient peut-etre pas de texte exploitable.";
    }
  } else {
    source = "paste";
    rawText = (pastedText as string).trim().slice(0, MAX_PASTE_LENGTH);
  }

  let structured;
  try {
    structured = await structureLinkedinProfile(rawText, userId);
  } catch (error) {
    console.error("LinkedIn AI structuring failed:", error);
    return NextResponse.json(
      {
        error:
          "L'analyse IA du profil a echoue. Veuillez reessayer dans quelques instants.",
      },
      { status: 500 }
    );
  }

  let profile;
  try {
    profile = await upsertLinkedinProfile({
      userId,
      source,
      rawText,
      fileUrl,
      fileName,
      structured: structured as unknown as Record<string, unknown>,
      headline: structured.headline || null,
      summary: structured.summary || null,
    });
  } catch (error) {
    console.error("LinkedIn profile DB save failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du profil. Veuillez reessayer." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    profileId: profile.id,
    headline: structured.headline,
    summary: structured.summary,
    source,
  });
}
