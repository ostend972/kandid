import { getSupabaseAdmin } from "@/lib/supabase/client";

const BUCKET = "cv-files";

export async function uploadCV(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return data.path;
}

export async function getCVSignedUrl(path: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600); // 1 hour
  if (error) return null;
  return data.signedUrl;
}

export async function uploadCVImage(
  base64Data: string,
  userId: string,
  fileName: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.pdf$/i, "");
  const path = `${userId}/${Date.now()}-${safeName}.png`;

  const buffer = Buffer.from(base64Data, "base64");

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return data.path;
}

export async function deleteCV(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Profile Files (bucket: 'profile-files')
// ---------------------------------------------------------------------------

const PROFILE_BUCKET = "profile-files";

export async function uploadProfilePhoto(
  file: Buffer,
  userId: string,
  mimeType: "image/jpeg" | "image/png"
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const ext = mimeType === "image/jpeg" ? "jpg" : "png";
  const path = `${userId}/photo.${ext}`;

  // Delete existing photo first (could be either extension)
  await deleteProfilePhoto(userId);

  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(path, file, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Profile photo upload failed: ${error.message}`);
  return data.path;
}

export async function deleteProfilePhoto(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  // Try removing both possible extensions
  await supabase.storage
    .from(PROFILE_BUCKET)
    .remove([`${userId}/photo.jpg`, `${userId}/photo.png`]);
}

export async function uploadLinkedinPdf(
  buffer: Buffer,
  fileName: string,
  userId: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${userId}/linkedin/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw new Error(`LinkedIn PDF upload failed: ${error.message}`);
  return data.path;
}

export async function deleteLinkedinPdf(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(PROFILE_BUCKET).remove([path]);
  if (error) throw new Error(`LinkedIn PDF delete failed: ${error.message}`);
}

export async function uploadProfileDocument(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${userId}/documents/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw new Error(`Document upload failed: ${error.message}`);
  return data.path;
}

export async function deleteProfileDocument(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(PROFILE_BUCKET).remove([path]);
  if (error) throw new Error(`Document delete failed: ${error.message}`);
}

export async function getProfileSignedUrl(
  path: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .createSignedUrl(path, 3600); // 1 hour
  if (error) return null;
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Application Files (bucket: 'application-files')
// ---------------------------------------------------------------------------

const APPLICATION_BUCKET = "application-files";

export async function uploadApplicationPdf(
  file: Buffer,
  userId: string,
  applicationId: string,
  fileName: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const path = `${userId}/${applicationId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(APPLICATION_BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error)
    throw new Error(`Application PDF upload failed: ${error.message}`);
  return data.path;
}

export async function getApplicationSignedUrl(
  path: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(APPLICATION_BUCKET)
    .createSignedUrl(path, 3600); // 1 hour
  if (error) return null;
  return data.signedUrl;
}

export async function getApplicationFileBuffer(
  path: string
): Promise<Buffer> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(APPLICATION_BUCKET)
    .download(path);

  if (error)
    throw new Error(`Application file download failed: ${error.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteApplicationFiles(
  userId: string,
  applicationId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const folder = `${userId}/${applicationId}`;

  const { data: files, error: listError } = await supabase.storage
    .from(APPLICATION_BUCKET)
    .list(folder);

  if (listError)
    throw new Error(
      `Listing application files failed: ${listError.message}`
    );

  if (files && files.length > 0) {
    const paths = files.map((f) => `${folder}/${f.name}`);
    const { error: removeError } = await supabase.storage
      .from(APPLICATION_BUCKET)
      .remove(paths);
    if (removeError)
      throw new Error(
        `Deleting application files failed: ${removeError.message}`
      );
  }
}
