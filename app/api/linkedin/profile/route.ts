import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getLinkedinProfile,
  getLinkedinPosts,
  getLatestPostBatch,
} from "@/lib/db/kandid-queries";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Non autorise." },
      { status: 401 }
    );
  }

  const profile = await getLinkedinProfile(userId);
  if (!profile) {
    return NextResponse.json({ profile: null, posts: [] });
  }

  const latestBatch = await getLatestPostBatch(userId);
  const posts = latestBatch
    ? await getLinkedinPosts(userId, latestBatch)
    : [];

  return NextResponse.json({ profile, posts });
}
