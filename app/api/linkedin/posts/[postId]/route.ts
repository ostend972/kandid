import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { updateLinkedinPostContent } from "@/lib/db/kandid-queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte." },
      { status: 401 }
    );
  }

  const { postId } = await params;
  if (!postId) {
    return NextResponse.json(
      { error: "ID du post manquant." },
      { status: 400 }
    );
  }

  let body: { userContent?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide." },
      { status: 400 }
    );
  }

  if (typeof body.userContent !== "string") {
    return NextResponse.json(
      { error: "Le champ userContent est requis." },
      { status: 400 }
    );
  }

  const updated = await updateLinkedinPostContent(postId, userId, body.userContent);
  if (!updated) {
    return NextResponse.json(
      { error: "Post introuvable ou non autorise." },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}
