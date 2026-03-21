export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validatePdfFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: "Seuls les fichiers PDF sont acceptes." };
  }
  if (file.type !== "application/pdf") {
    return {
      valid: false,
      error: "Le fichier ne semble pas etre un PDF valide.",
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Le fichier depasse la taille maximale de 10 Mo.",
    };
  }
  return { valid: true };
}

// Server-side: check PDF magic bytes
export function validatePdfBuffer(buffer: Buffer): {
  valid: boolean;
  error?: string;
} {
  if (buffer.length < 5) {
    return { valid: false, error: "Fichier trop petit pour etre un PDF." };
  }
  const header = buffer.subarray(0, 5).toString("ascii");
  if (header !== "%PDF-") {
    return {
      valid: false,
      error: "Le fichier n'est pas un PDF valide (magic bytes).",
    };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
