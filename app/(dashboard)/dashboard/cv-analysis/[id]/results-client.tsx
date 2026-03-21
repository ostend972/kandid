"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScoreGauge } from "@/components/cv/score-gauge";
import {
  AllCategories,
  type CategoryData,
} from "@/components/cv/category-section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SerializedAnalysis {
  id: string;
  fileName: string;
  overallScore: number;
  imageUrl: string | null;
  feedback: Record<
    string,
    {
      score: number;
      tips: Array<{
        type: string;
        title: string;
        explanation: string;
        suggestion?: string;
      }>;
    }
  >;
  profile: Record<string, unknown>;
  createdAt: string;
  signedPdfUrl: string | null;
}

type CategoryKey =
  | "ats"
  | "swissAdaptation"
  | "content"
  | "structure"
  | "skills";

// ---------------------------------------------------------------------------
// Verdict text
// ---------------------------------------------------------------------------
function getVerdict(score: number) {
  if (score >= 80) {
    return {
      text: "Excellent ! Votre CV est bien adapte au marche suisse.",
      color: "text-green-600",
    };
  }
  if (score >= 40) {
    return {
      text: "Bon potentiel. Quelques ajustements amelioreront vos chances.",
      color: "text-amber-600",
    };
  }
  return {
    text: "A ameliorer. Votre CV necessite des modifications importantes.",
    color: "text-red-600",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CvResultsClient({
  analysis,
}: {
  analysis: SerializedAnalysis;
}) {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const verdict = getVerdict(analysis.overallScore);

  async function handleReanalyze() {
    if (!analysis.signedPdfUrl) return;
    setIsReanalyzing(true);

    try {
      // 1. Download the PDF from signed URL
      const pdfResponse = await fetch(analysis.signedPdfUrl);
      const pdfBlob = await pdfResponse.blob();
      const pdfFile = new File([pdfBlob], analysis.fileName, { type: "application/pdf" });

      // 2. Convert all pages to images (dynamic import to keep bundle small)
      const { pdfToImages } = await import("@/lib/pdf-to-image");
      const allImages = await pdfToImages(pdfFile);

      // 3. Send to reanalyze API
      const res = await fetch("/api/reanalyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysis.id,
          allImagesBase64: allImages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      // 4. Reload page to show updated results
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error("Reanalysis failed:", error);
      alert("La reanalyse a echoue. Veuillez reessayer.");
    } finally {
      setIsReanalyzing(false);
    }
  }

  // Cast feedback categories
  const categoryKeys: CategoryKey[] = [
    "ats",
    "swissAdaptation",
    "content",
    "structure",
    "skills",
  ];

  const categories = {} as Record<CategoryKey, CategoryData>;
  for (const key of categoryKeys) {
    const raw = analysis.feedback[key];
    if (raw) {
      categories[key] = {
        score: raw.score,
        tips: raw.tips.map((t) => ({
          type: t.type as "good" | "improve" | "critical",
          title: t.title,
          explanation: t.explanation,
          suggestion: t.suggestion,
        })),
      };
    } else {
      categories[key] = { score: 0, tips: [] };
    }
  }

  const formattedDate = new Date(analysis.createdAt).toLocaleDateString(
    "fr-CH",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/cv-analysis"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux analyses
      </Link>

      {/* Desktop: split view / Mobile: stacked */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── Left panel: PDF preview (desktop) ──────────────────────────── */}
        <div className="hidden lg:block lg:w-2/5 lg:shrink-0">
          <PdfPreviewPanel
            fileName={analysis.fileName}
            imageUrl={analysis.imageUrl}
            signedPdfUrl={analysis.signedPdfUrl}
            date={formattedDate}
          />
        </div>

        {/* ─── Right panel: Feedback ─────────────────────────────────────── */}
        <div className="flex-1 space-y-6">
          {/* Overall score */}
          <Card>
            <CardContent className="flex flex-col items-center py-8">
              <ScoreGauge score={analysis.overallScore} size="lg" />
              <h2 className="mt-4 text-lg font-bold text-gray-900">
                Score Kandid
              </h2>
              <p className={cn("mt-1 text-center text-sm", verdict.color)}>
                {verdict.text}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={handleReanalyze}
                disabled={isReanalyzing || !analysis.signedPdfUrl}
              >
                {isReanalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reanalyse en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Reanalyser ce CV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Category sections */}
          <AllCategories categories={categories} />
        </div>
      </div>

      {/* ─── Mobile: collapsible PDF preview at bottom ─────────────────── */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowPreview(!showPreview)}
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Apercu du CV
          </span>
          {showPreview ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {showPreview && (
          <div className="mt-3">
            <PdfPreviewPanel
              fileName={analysis.fileName}
              imageUrl={analysis.imageUrl}
              signedPdfUrl={analysis.signedPdfUrl}
              date={formattedDate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF Preview Panel sub-component
// ---------------------------------------------------------------------------
function PdfPreviewPanel({
  fileName,
  imageUrl,
  signedPdfUrl,
  date,
}: {
  fileName: string;
  imageUrl: string | null;
  signedPdfUrl: string | null;
  date: string;
}) {
  return (
    <Card className="sticky top-4">
      <CardContent className="space-y-4 pt-6">
        {/* PDF preview image */}
        {imageUrl ? (
          <div className="overflow-hidden rounded-md border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Apercu de la premiere page du CV"
              className="w-full"
            />
          </div>
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center rounded-md border bg-gray-50">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-xs text-muted-foreground">
                Apercu non disponible
              </p>
            </div>
          </div>
        )}

        {/* File info */}
        <div>
          <p className="truncate text-sm font-medium text-gray-900">
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>

        {/* Open PDF link */}
        {signedPdfUrl && (
          <Button variant="outline" className="w-full" asChild>
            <a href={signedPdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir le PDF
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
