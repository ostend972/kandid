import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getCvAnalysisById } from "@/lib/db/kandid-queries";
import { getCVSignedUrl } from "@/lib/storage/cv-upload";
import { CvResultsClient } from "./results-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CvAnalysisResultPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  // Fetch analysis from DB
  const analysis = await getCvAnalysisById(id);
  if (!analysis) {
    notFound();
  }

  // Verify ownership
  if (analysis.userId !== userId) {
    notFound();
  }

  // Generate signed URLs for the PDF and preview image
  const signedUrl = await getCVSignedUrl(analysis.fileUrl);
  const signedImageUrl = analysis.imageUrl
    ? await getCVSignedUrl(analysis.imageUrl)
    : null;

  // Serialize data for the client component
  const serializedAnalysis = {
    id: analysis.id,
    fileName: analysis.fileName,
    overallScore: analysis.overallScore,
    imageUrl: signedImageUrl,
    feedback: analysis.feedback as Record<
      string,
      { score: number; tips: Array<{ type: string; title: string; explanation: string; suggestion?: string }> }
    >,
    profile: analysis.profile as Record<string, unknown>,
    createdAt: analysis.createdAt?.toISOString() ?? new Date().toISOString(),
    signedPdfUrl: signedUrl,
  };

  return <CvResultsClient analysis={serializedAnalysis} />;
}
