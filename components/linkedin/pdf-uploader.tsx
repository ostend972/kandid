"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { Upload, FileText, X, ClipboardPaste, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { validatePdfFile, formatFileSize } from "@/lib/file-validation";
import { cn } from "@/lib/utils";

interface PdfUploaderProps {
  onImportComplete: (profileId: string) => void;
  disabled?: boolean;
}

type Mode = "pdf" | "paste";

const MAX_PASTE_LENGTH = 10_000;

export function PdfUploader({ onImportComplete, disabled }: PdfUploaderProps) {
  const [mode, setMode] = useState<Mode>("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      setError(validation.error ?? "Fichier invalide.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isPending) setIsDragOver(true);
    },
    [disabled, isPending]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled || isPending) return;
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [disabled, isPending, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isPending) inputRef.current?.click();
  }, [disabled, isPending]);

  const handleSubmit = useCallback(() => {
    setError(null);

    if (mode === "pdf" && !selectedFile) {
      setError("Veuillez selectionner un fichier PDF.");
      return;
    }
    if (mode === "paste" && !pastedText.trim()) {
      setError("Veuillez coller le texte de votre profil LinkedIn.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        if (mode === "pdf" && selectedFile) {
          formData.append("file", selectedFile);
        } else {
          formData.append("pastedText", pastedText);
        }

        const res = await fetch("/api/linkedin/import", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Une erreur est survenue.");
          return;
        }

        onImportComplete(data.profileId);
      } catch {
        setError("Erreur de connexion. Veuillez reessayer.");
      }
    });
  }, [mode, selectedFile, pastedText, onImportComplete]);

  const isDisabled = disabled || isPending;
  const canSubmit =
    !isDisabled &&
    ((mode === "pdf" && selectedFile !== null) ||
      (mode === "paste" && pastedText.trim().length > 0));

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "pdf" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("pdf");
            setError(null);
          }}
          disabled={isDisabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          PDF LinkedIn
        </Button>
        <Button
          type="button"
          variant={mode === "paste" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("paste");
            setError(null);
          }}
          disabled={isDisabled}
        >
          <ClipboardPaste className="mr-2 h-4 w-4" />
          Copier-coller
        </Button>
      </div>

      {mode === "pdf" && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="hidden"
            disabled={isDisabled}
          />

          {!selectedFile ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="rounded-full bg-muted p-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Glissez votre PDF LinkedIn ici ou cliquez pour parcourir
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF uniquement, 10 Mo maximum
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <div className="rounded-md bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={isDisabled}
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Supprimer le fichier</span>
              </Button>
            </div>
          )}
        </>
      )}

      {mode === "paste" && (
        <div className="space-y-2">
          <Textarea
            placeholder="Copiez-collez ici le contenu de votre page LinkedIn (sections A propos, Experience, Formation, Competences...)"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={isDisabled}
            rows={8}
            maxLength={MAX_PASTE_LENGTH}
          />
          <p className="text-xs text-muted-foreground text-right">
            {pastedText.length.toLocaleString()} / {MAX_PASTE_LENGTH.toLocaleString()} caracteres
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          "Importer et analyser"
        )}
      </Button>
    </div>
  );
}
