"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/cv/file-uploader";
import { pdfToImages } from "@/lib/pdf-to-image";
import { extractFaceFromPdf } from "@/lib/face-detect";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ArrowRight, Clock, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types for previous analyses list
// ---------------------------------------------------------------------------
interface PreviousAnalysis {
  id: string;
  fileName: string;
  overallScore: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helper: relative date in French
// ---------------------------------------------------------------------------
function relativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Score badge with color
// ---------------------------------------------------------------------------
function ScoreBadge({ score }: { score: number }) {
  const variant =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"
      : score >= 40
        ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
        : "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400";

  return (
    <Badge variant="secondary" className={cn("font-bold tabular-nums", variant)}>
      {score}/100
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Delete button with confirmation
// ---------------------------------------------------------------------------
function DeleteAnalysisButton({
  analysisId,
  fileName,
  onDeleted,
}: {
  analysisId: string;
  fileName: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/cv-analyses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: analysisId }),
      });
      if (res.ok) {
        onDeleted();
        setOpen(false);
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Supprimer cette analyse ?</DialogTitle>
          <DialogDescription>
            Le fichier &laquo;{fileName}&raquo; et tous les resultats associes
            seront supprimes definitivement. Cette action est irreversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CvAnalysisPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<PreviousAnalysis[]>(
    []
  );
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch previous analyses
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/cv-analyses");
        if (res.ok) {
          const data = await res.json();
          setPreviousAnalyses(data.analyses ?? []);
        }
      } catch {
        // Silently fail — history is non-critical
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, []);

  // Handle submit
  async function handleSubmit() {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Convert PDF pages to images + detect face in parallel
      const [allImages, faceBlob] = await Promise.all([
        pdfToImages(file),
        extractFaceFromPdf(file).catch(() => null),
      ]);

      // 2. Build FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageBase64", allImages[0] || "");
      formData.append("allImagesBase64", JSON.stringify(allImages));
      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription.trim());
      }
      if (faceBlob) {
        formData.append("faceImage", faceBlob, "face.jpg");
      }

      // 3. Send to API
      const res = await fetch("/api/analyze-cv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setIsAnalyzing(false);
        return;
      }

      // 4. Redirect to results
      router.push(data.redirectUrl);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Une erreur est survenue lors de l'analyse. Veuillez reessayer.");
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analyse de CV</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Telechargez votre CV pour obtenir une analyse ATS detaillee adaptee au
          marche suisse.
        </p>
      </div>

      {/* Upload form */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* File uploader */}
          <div>
            <FileUploader onFileSelect={setFile} disabled={isAnalyzing} />
          </div>

          {/* Job description (optional) */}
          <div>
            <label
              htmlFor="jobDescription"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Description du poste (optionnel)
            </label>
            <Textarea
              id="jobDescription"
              placeholder="Collez la description du poste pour une analyse ciblee..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isAnalyzing}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!file || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Analyser mon CV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading animation overlay (replaces the card when analyzing) */}
      {isAnalyzing && (
        <Card className="bg-muted">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-border border-t-foreground animate-spin" />
            </div>
            <h3 className="mt-6 text-lg font-bold tracking-tight text-foreground">
              Analyse en cours...
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Notre IA analyse votre CV selon les criteres ATS suisses.
              Cela peut prendre quelques secondes.
            </p>
            {/* Progress-style dots animation */}
            <div className="mt-4 flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-foreground animate-bounce [animation-delay:0ms]" />
              <div className="h-2 w-2 rounded-full bg-foreground animate-bounce [animation-delay:150ms]" />
              <div className="h-2 w-2 rounded-full bg-foreground animate-bounce [animation-delay:300ms]" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous analyses */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Analyses precedentes
        </h2>

        {loadingHistory ? (
          <div className="mt-4 flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : previousAnalyses.length === 0 ? (
          <Card className="mt-4 border-dashed">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Vous n&apos;avez pas encore analyse de CV
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {previousAnalyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="cursor-pointer transition-colors hover:bg-muted"
                onClick={() =>
                  router.push(`/dashboard/cv-analysis/${analysis.id}`)
                }
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="rounded-lg bg-muted p-2">
                    <FileText className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {analysis.fileName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {relativeDate(analysis.createdAt)}
                    </div>
                  </div>
                  <ScoreBadge score={analysis.overallScore} />
                  <DeleteAnalysisButton
                    analysisId={analysis.id}
                    fileName={analysis.fileName}
                    onDeleted={() =>
                      setPreviousAnalyses((prev) =>
                        prev.filter((a) => a.id !== analysis.id)
                      )
                    }
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
