import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getLinkedinProfile, getUserById, updateLinkedinAudit } from "@/lib/db/kandid-queries";
import { auditLinkedinProfile } from "@/lib/ai/linkedin-audit";
import type { LinkedinStructuredProfile } from "@/lib/validations/linkedin";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte pour lancer un audit LinkedIn." },
      { status: 401 }
    );
  }

  const profile = await getLinkedinProfile(userId);
  if (!profile?.structured) {
    return NextResponse.json(
      { error: "Aucun profil LinkedIn importe. Veuillez d'abord importer votre profil." },
      { status: 400 }
    );
  }

  const user = await getUserById(userId);
  const userContext = user
    ? {
        sector: user.sector,
        position: user.position,
        experienceLevel: user.experienceLevel,
      }
    : undefined;

  let auditResult;
  try {
    auditResult = await auditLinkedinProfile(
      profile.structured as unknown as LinkedinStructuredProfile,
      userId,
      userContext
    );
  } catch (error) {
    console.error("LinkedIn audit AI failed:", error);
    return NextResponse.json(
      { error: "L'audit IA a echoue. Veuillez reessayer dans quelques instants." },
      { status: 500 }
    );
  }

  try {
    await updateLinkedinAudit(
      userId,
      auditResult.score,
      auditResult as unknown as Record<string, unknown>
    );
  } catch (error) {
    console.error("LinkedIn audit DB save failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde de l'audit. Veuillez reessayer." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    score: auditResult.score,
    weaknesses: auditResult.weaknesses,
    recommendations: auditResult.recommendations,
  });
}
