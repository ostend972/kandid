"use client";

import { RefreshCw, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LinkedinAuditResult } from "@/lib/validations/linkedin";

interface AuditResultsProps {
  auditScore: number | null;
  auditResult: LinkedinAuditResult | null;
  onRunAudit: () => void;
  isLoading: boolean;
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score < 40 ? "text-red-500" : score < 70 ? "text-orange-500" : "text-green-500";
  const bgColor =
    score < 40 ? "stroke-red-100" : score < 70 ? "stroke-orange-100" : "stroke-green-100";
  const fgColor =
    score < 40 ? "stroke-red-500" : score < 70 ? "stroke-orange-500" : "stroke-green-500";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            className={bgColor}
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(fgColor, "transition-all duration-1000")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-3xl font-bold", color)}>{score}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Score SEO LinkedIn</p>
    </div>
  );
}

const impactColors: Record<string, string> = {
  haute: "bg-red-100 text-red-700",
  moyenne: "bg-orange-100 text-orange-700",
  basse: "bg-blue-100 text-blue-700",
};

const priorityColors: Record<string, string> = {
  haute: "bg-red-100 text-red-700",
  moyenne: "bg-orange-100 text-orange-700",
  basse: "bg-blue-100 text-blue-700",
};

export function AuditResults({
  auditScore,
  auditResult,
  onRunAudit,
  isLoading,
}: AuditResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Analyse SEO en cours...</p>
      </div>
    );
  }

  if (auditScore === null || !auditResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-muted-foreground">
          Lancez un audit pour evaluer la qualite SEO de votre profil LinkedIn.
        </p>
        <Button onClick={onRunAudit} variant="outline">
          Lancer l&apos;audit SEO
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <ScoreGauge score={auditScore} />
        <Button onClick={onRunAudit} variant="ghost" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Relancer l&apos;audit
        </Button>
      </div>

      {auditResult.weaknesses.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Points faibles
          </h4>
          <ul className="space-y-2">
            {auditResult.weaknesses.map((w, i) => (
              <li key={i} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      impactColors[w.impact] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    {w.category}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      impactColors[w.impact] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    Impact {w.impact}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {auditResult.recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Recommandations
          </h4>
          <ul className="space-y-2">
            {auditResult.recommendations.map((r, i) => (
              <li key={i} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      priorityColors[r.priority] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    {r.category}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      priorityColors[r.priority] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    Priorite {r.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm">{r.action}</p>
                {r.example && (
                  <p className="mt-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground italic">
                    Exemple : {r.example}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
