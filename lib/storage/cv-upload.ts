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
