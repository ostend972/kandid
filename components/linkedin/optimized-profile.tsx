"use client";

import { useState } from "react";
import { RefreshCw, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OptimizedProfileProps {
  currentHeadline?: string | null;
  currentSummary?: string | null;
  optimizedHeadline?: string | null;
  optimizedSummary?: string | null;
  onOptimize: () => void;
  isLoading: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function ComparisonBlock({
  label,
  current,
  optimized,
}: {
  label: string;
  current?: string | null;
  optimized: string;
}) {
  const showComparison = current && current !== optimized;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{label}</h4>
        <CopyButton text={optimized} />
      </div>

      {showComparison ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-dashed p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Actuel</p>
            <p className="text-sm">{current}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-900 dark:bg-green-950/20">
            <p className="mb-1 text-xs font-medium text-green-700 dark:text-green-400">
              Optimise
            </p>
            <p className="text-sm">{optimized}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-900 dark:bg-green-950/20">
          <p className="text-sm">{optimized}</p>
        </div>
      )}
    </div>
  );
}

export function OptimizedProfile({
  currentHeadline,
  currentSummary,
  optimizedHeadline,
  optimizedSummary,
  onOptimize,
  isLoading,
}: OptimizedProfileProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Optimisation en cours...
        </p>
      </div>
    );
  }

  if (!optimizedHeadline && !optimizedSummary) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-muted-foreground">
          Generez un titre et un resume optimises pour votre secteur.
        </p>
        <Button onClick={onOptimize} variant="outline">
          Optimiser mon profil
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={onOptimize} variant="ghost" size="sm">
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Regenerer
        </Button>
      </div>

      {optimizedHeadline && (
        <ComparisonBlock
          label="Titre professionnel"
          current={currentHeadline}
          optimized={optimizedHeadline}
        />
      )}

      {optimizedSummary && (
        <ComparisonBlock
          label="Resume / A propos"
          current={currentSummary}
          optimized={optimizedSummary}
        />
      )}
    </div>
  );
}
