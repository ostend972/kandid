"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/cv/file-uploader";
import { pdfToImage } from "@/lib/pdf-to-image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ArrowRight, Clock } from "lucide-react";
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
      ? "bg-green-100 text-green-700"
      : score >= 40
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <Badge variant="secondary" className={cn("font-bold tabular-nums", variant)}>
      {score}/100
    </Badge>
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
      // 1. Convert PDF first page to image
      const imageBase64 = await pdfToImage(file);

      // 2. Build FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageBase64", imageBase64);
      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription.trim());
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
        <h1 className="text-2xl font-bold text-gray-900">Analyse de CV</h1>
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
              className="mb-2 block text-sm font-medium text-gray-700"
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
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!file || isAnalyzing}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
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
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-gray-900">
              Analyse en cours...
            </h3>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              Notre IA analyse votre CV selon les criteres ATS suisses.
              Cela peut prendre quelques secondes.
            </p>
            {/* Progress-style dots animation */}
            <div className="mt-4 flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0ms]" />
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:150ms]" />
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:300ms]" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous analyses */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Analyses precedentes
        </h2>

        {loadingHistory ? (
          <div className="mt-4 flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : previousAnalyses.length === 0 ? (
          <Card className="mt-4 border-dashed">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <FileText className="h-10 w-10 text-gray-400" />
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
                className="cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() =>
                  router.push(`/dashboard/cv-analysis/${analysis.id}`)
                }
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="rounded-md bg-indigo-50 p-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {analysis.fileName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {relativeDate(analysis.createdAt)}
                    </div>
                  </div>
                  <ScoreBadge score={analysis.overallScore} />
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
