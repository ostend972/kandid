import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  uploadProfilePhoto,
  deleteProfilePhoto,
  getProfileSignedUrl,
} from "@/lib/storage/cv-upload";
import { getUserById, updateUserPhoto } from "@/lib/db/kandid-queries";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// GET /api/profile/photo — return a signed URL for the current user's photo
// ---------------------------------------------------------------------------

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const dbUser = await getUserById(user.id);
  if (!dbUser?.photoUrl) {
    return NextResponse.json({ signedUrl: null });
  }

  const signedUrl = await getProfileSignedUrl(dbUser.photoUrl);
  return NextResponse.json({ signedUrl });
}

// ---------------------------------------------------------------------------
// POST /api/profile/photo — upload profile photo
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorise." },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Requete invalide." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier fourni." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Seuls les fichiers JPG et PNG sont acceptes." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Le fichier depasse la taille maximale de 5 Mo." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let path: string;
  try {
    path = await uploadProfilePhoto(
      buffer,
      user.id,
      file.type as "image/jpeg" | "image/png"
    );
  } catch (error) {
    console.error("Profile photo upload failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la photo." },
      { status: 500 }
    );
  }

  try {
    await updateUserPhoto(user.id, path);
  } catch (error) {
    console.error("Profile photo DB update failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde." },
      { status: 500 }
    );
  }

  return NextResponse.json({ path });
}

// ---------------------------------------------------------------------------
// DELETE /api/profile/photo — remove profile photo
// ---------------------------------------------------------------------------

export async function DELETE() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorise." },
      { status: 401 }
    );
  }

  try {
    await deleteProfilePhoto(user.id);
    await updateUserPhoto(user.id, null);
  } catch (error) {
    console.error("Profile photo delete failed:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
