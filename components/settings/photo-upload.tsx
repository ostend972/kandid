"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PhotoCropModal } from "./photo-crop-modal";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB before crop (output is always compressed JPEG)

interface PhotoUploadProps {
  currentPhotoUrl: string | null;
}

export function PhotoUpload({ currentPhotoUrl }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporte. Utilisez JPG ou PNG.");
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("Le fichier depasse la taille maximale de 10 Mo.");
      return;
    }

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleCropComplete(blob: Blob) {
    setCropSrc(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");

    try {
      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'envoi.");
      }

      setPreview(URL.createObjectURL(blob));
      toast.success("Photo mise a jour.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'envoi."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);

    try {
      const res = await fetch("/api/profile/photo", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la suppression.");
      }

      setPreview(null);
      toast.success("Photo supprimee.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Photo de profil"
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground" />
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {preview ? "Changer la photo" : "Ajouter une photo"}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Crop modal */}
      {cropSrc && (
        <PhotoCropModal
          open={!!cropSrc}
          imageSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
