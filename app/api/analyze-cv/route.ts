import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { validatePdfBuffer, MAX_FILE_SIZE } from "@/lib/file-validation";
import { uploadCV, uploadCVImage, getCVSignedUrl } from "@/lib/storage/cv-upload";
import { analyzeCvWithRetry } from "@/lib/ai/analyze-cv";
import {
  createCvAnalysis,
  updateUserActiveCv,
  getCvAnalysesByUserId,
  getUserById,
  upsertUser,
  updateUserPhoto,
} from "@/lib/db/kandid-queries";
import { sendAnalysisCompleteEmail } from "@/lib/email/resend";
import { uploadProfilePhoto } from "@/lib/storage/cv-upload";

// ---------------------------------------------------------------------------
// POST /api/analyze-cv
// ---------------------------------------------------------------------------
// Request: multipart/form-data
//   - file: PDF file (max 10 MB)
//   - imageBase64: string (first page rendered as PNG base64 by the client)
//   - jobDescription?: string (optional, for targeted analysis)
//
// Response (200):
//   { id: string, overallScore: number, redirectUrl: string }
//
// Errors: 400 / 401 / 429 / 500
// ---------------------------------------------------------------------------

const MAX_DAILY_ANALYSES = 3; // free plan limit (not enforced during beta)
const BETA_MODE = true; // set to false to enforce rate limits

export async function POST(request: NextRequest) {
  // ── 1. Authentication ────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte pour analyser un CV." },
      { status: 401 }
    );
  }

  // ── 2. Parse multipart form data ─────────────────────────────────────
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
  const imageBase64 = formData.get("imageBase64");
  const allImagesBase64Raw = formData.get("allImagesBase64");
  const jobDescription = formData.get("jobDescription");

  // Parse all page images (fallback to single image for backward compat)
  let allImages: string[] = [];
  if (typeof allImagesBase64Raw === "string") {
    try {
      allImages = JSON.parse(allImagesBase64Raw);
    } catch {
      // Fallback to single image
    }
  }
  if (allImages.length === 0 && typeof imageBase64 === "string") {
    allImages = [imageBase64];
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier PDF fourni." },
      { status: 400 }
    );
  }

  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return NextResponse.json(
      {
        error:
          "L'image du CV est requise. Veuillez reessayer le telechargement.",
      },
      { status: 400 }
    );
  }

  // ── 3. Validate file ─────────────────────────────────────────────────
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

  // ── 3b. Ensure user exists in DB (fallback if webhook hasn't fired) ──
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      await upsertUser({
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        fullName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
        avatarUrl: clerkUser.imageUrl || null,
      });
    }
  }

  // ── 4. Rate limit check ──────────────────────────────────────────────
  if (!BETA_MODE) {
    const existingAnalyses = await getCvAnalysesByUserId(userId);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayCount = existingAnalyses.filter(
      (a) => a.createdAt && new Date(a.createdAt) > oneDayAgo
    ).length;

    if (todayCount >= MAX_DAILY_ANALYSES) {
      return NextResponse.json(
        {
          error: `Vous avez atteint la limite de ${MAX_DAILY_ANALYSES} analyses par jour. Passez au plan Pro pour des analyses illimitees.`,
        },
        { status: 429 }
      );
    }
  }

  // ── 5. Upload PDF to Supabase Storage ────────────────────────────────
  let storagePath: string;
  try {
    storagePath = await uploadCV(buffer, file.name, userId);
  } catch (error) {
    console.error("CV upload to storage failed:", error);
    return NextResponse.json(
      {
        error:
          "Erreur lors de l'envoi du fichier. Veuillez reessayer.",
      },
      { status: 500 }
    );
  }

  // ── 5b. Upload preview image to Supabase Storage ────────────────────
  let imagePath: string | null = null;
  try {
    imagePath = await uploadCVImage(imageBase64, userId, file.name);
  } catch (error) {
    console.error("CV image upload failed (non-blocking):", error);
  }

  // ── 6. AI analysis ──────────────────────────────────────────────────
  let feedback;
  let aiUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;
  try {
    const result = await analyzeCvWithRetry(
      allImages,
      typeof jobDescription === "string" && jobDescription.length > 0
        ? jobDescription
        : undefined
    );
    feedback = result.data;
    aiUsage = result.usage;
  } catch (error) {
    console.error("CV AI analysis failed after retry:", error);
    return NextResponse.json(
      {
        error:
          "L'analyse IA a echoue. Veuillez reessayer dans quelques instants.",
      },
      { status: 500 }
    );
  }

  // ── 7. Save to database ──────────────────────────────────────────────
  let analysis;
  try {
    analysis = await createCvAnalysis({
      userId,
      fileName: file.name,
      fileUrl: storagePath,
      imageUrl: imagePath, // Storage path for preview image
      overallScore: feedback.overallScore,
      profile: feedback.profile as unknown as Record<string, unknown>,
      feedback: feedback.categories as unknown as Record<string, unknown>,
    });
  } catch (error) {
    console.error("CV analysis DB save failed:", error);
    return NextResponse.json(
      {
        error:
          "Erreur lors de la sauvegarde des resultats. Veuillez reessayer.",
      },
      { status: 500 }
    );
  }

  // ── 7b. Auto-save detected face as profile photo ─────────────────────
  const faceImage = formData.get("faceImage");
  if (faceImage instanceof File && faceImage.size > 0) {
    try {
      const dbUser = await getUserById(userId);
      if (!dbUser?.photoUrl) {
        const faceBuffer = Buffer.from(await faceImage.arrayBuffer());
        const photoPath = await uploadProfilePhoto(
          faceBuffer,
          userId,
          "image/jpeg"
        );
        await updateUserPhoto(userId, photoPath);
      }
    } catch (error) {
      console.error("Auto face photo save failed (non-blocking):", error);
    }
  }

  // ── 8. Update user's active CV analysis ──────────────────────────────
  try {
    await updateUserActiveCv(userId, analysis.id);
  } catch (error) {
    // Non-blocking: the analysis is saved, just the active pointer failed
    console.error("Failed to update active CV analysis:", error);
  }

  // ── 9. Send analysis complete email (fire-and-forget) ────────────────
  getUserById(userId).then((user) => {
    if (user?.email) {
      sendAnalysisCompleteEmail(
        user.email,
        user.fullName?.split(" ")[0] || "",
        feedback.overallScore,
        analysis.id
      );
    }
  }).catch((err) => {
    console.error("Failed to fetch user for analysis email:", err);
  });

  // ── 10. Return result ────────────────────────────────────────────────
  return NextResponse.json({
    id: analysis.id,
    overallScore: feedback.overallScore,
    redirectUrl: `/dashboard/cv-analysis/${analysis.id}`,
  });
}
