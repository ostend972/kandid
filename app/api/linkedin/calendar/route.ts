import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getLinkedinProfile,
  getUserById,
  createLinkedinPosts,
} from "@/lib/db/kandid-queries";
import { generateEditorialCalendar } from "@/lib/ai/linkedin-calendar";
import { checkRateLimit } from "@/lib/rate-limit";
import type { LinkedinStructuredProfile, LinkedinCalendarResult } from "@/lib/validations/linkedin";
import crypto from "crypto";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte pour generer un calendrier editorial." },
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
    strengths: null as string[] | null,
    careerSummary: null as string | null,
  };

  const structured = profile.structured as unknown as LinkedinStructuredProfile;
  if (structured.summary) {
    userContext.careerSummary = structured.summary;
  }
  if (structured.skills?.length) {
    userContext.strengths = structured.skills.slice(0, 5);
  }

  let calendarPosts: LinkedinCalendarResult;
  try {
    calendarPosts = await generateEditorialCalendar(structured, userId, userContext);
  } catch (error) {
    console.error("LinkedIn calendar AI failed:", error);
    return NextResponse.json(
      { error: "La generation du calendrier a echoue. Veuillez reessayer." },
      { status: 500 }
    );
  }

  const batchId = crypto.randomUUID();

  try {
    const postsToInsert = calendarPosts.map((post: LinkedinCalendarResult[number], index: number) => ({
      userId,
      profileId: profile.id,
      weekNumber: post.weekNumber,
      dayOfWeek: post.dayOfWeek,
      contentType: post.contentType,
      title: post.title,
      draftContent: post.draftContent,
      generationBatch: batchId,
      sortOrder: index,
    }));

    const savedPosts = await createLinkedinPosts(postsToInsert);

    return NextResponse.json({
      batchId,
      posts: savedPosts,
    });
  } catch (error) {
    console.error("LinkedIn calendar DB save failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du calendrier. Veuillez reessayer." },
      { status: 500 }
    );
  }
}
