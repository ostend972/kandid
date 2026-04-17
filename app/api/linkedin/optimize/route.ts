import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getLinkedinProfile, getUserById, updateLinkedinOptimized } from "@/lib/db/kandid-queries";
import { optimizeLinkedinHeadline } from "@/lib/ai/linkedin-optimize";
import { checkRateLimit } from "@/lib/rate-limit";
import type { LinkedinStructuredProfile } from "@/lib/validations/linkedin";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte pour optimiser votre profil LinkedIn." },
      { status: 401 }
    );
  }

  const rateLimited = await checkRateLimit(userId, 'ai');
  if (rateLimited) return rateLimited;

  const profile = await getLinkedinProfile(userId);
  if (!profile?.structured) {
    return NextResponse.json(
      { error: "Aucun profil LinkedIn importe. Veuillez d'abord importer votre profil." },
      { status: 400 }
    );
  }

  const user = await getUserById(userId);
  const userContext = {
    sector: user?.sector ?? null,
    position: user?.position ?? null,
    experienceLevel: user?.experienceLevel ?? null,
    careerSummary: null as string | null,
    strengths: null as string[] | null,
  };

  let optimizeResult;
  try {
    optimizeResult = await optimizeLinkedinHeadline(
      profile.structured as unknown as LinkedinStructuredProfile,
      userId,
      userContext
    );
  } catch (error) {
    console.error("LinkedIn optimize AI failed:", error);
    return NextResponse.json(
      { error: "L'optimisation IA a echoue. Veuillez reessayer dans quelques instants." },
      { status: 500 }
    );
  }

  try {
    await updateLinkedinOptimized(userId, optimizeResult.headline, optimizeResult.summary);
  } catch (error) {
    console.error("LinkedIn optimize DB save failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde. Veuillez reessayer." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    headline: optimizeResult.headline,
    summary: optimizeResult.summary,
  });
}
