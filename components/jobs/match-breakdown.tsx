'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Lightbulb, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface Requirement {
  requirement: string;
  status: 'met' | 'partial' | 'not_met';
  explanation: string;
  suggestion?: string;
}

interface MatchResult {
  id: string | null;
  overallScore: number;
  verdict: 'excellent' | 'partial' | 'low';
  requirements: Requirement[];
  cached: boolean;
}

interface MatchBreakdownProps {
  jobId: string;
  cvAnalysisId: string;
  cvFileName: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getVerdictConfig(verdict: string, score: number) {
  if (verdict === 'excellent' || score >= 75) {
    return {
      label: 'Correspondance excellente',
      description: 'Votre profil est bien adapte a ce poste.',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      progressColor: '[&>div[data-slot=progress-indicator]]:bg-emerald-500',
    };
  }
  if (verdict === 'partial' || score >= 40) {
    return {
      label: 'Bon potentiel',
      description: 'Votre profil a du potentiel pour ce poste, avec quelques ajustements.',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      progressColor: '[&>div[data-slot=progress-indicator]]:bg-amber-500',
    };
  }
  return {
    label: 'A ameliorer',
    description: 'Votre profil necessite des ameliorations pour ce poste.',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    progressColor: '[&>div[data-slot=progress-indicator]]:bg-red-500',
  };
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'met':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />;
    case 'partial':
      return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />;
    case 'not_met':
      return <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />;
    default:
      return null;
  }
}

function getStatusBgColor(status: string) {
  switch (status) {
    case 'met':
      return 'bg-emerald-50 border-emerald-100';
    case 'partial':
      return 'bg-amber-50 border-amber-100';
    case 'not_met':
      return 'bg-red-50 border-red-100';
    default:
      return 'bg-gray-50 border-gray-100';
  }
}

// =============================================================================
// Component
// =============================================================================

export function MatchBreakdown({ jobId, cvAnalysisId, cvFileName }: MatchBreakdownProps) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, cvAnalysisId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

      const data: MatchResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue. Veuillez reessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [jobId, cvAnalysisId]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading state ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <Sparkles className="h-4 w-4 text-indigo-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-indigo-700">
              Analyse en cours...
            </p>
            <p className="text-xs text-indigo-500 mt-1">
              L'IA compare votre profil avec les exigences du poste
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 mt-2 p-0 h-auto font-medium"
          onClick={fetchMatch}
        >
          Reessayer l'analyse
        </Button>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────────────
  if (!result) return null;

  const verdictConfig = getVerdictConfig(result.verdict, result.overallScore);

  // Sort requirements: met first, then partial, then not_met
  const sortedRequirements = [...result.requirements].sort((a, b) => {
    const order = { met: 0, partial: 1, not_met: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden',
      verdictConfig.borderColor
    )}>
      {/* Header — Score summary */}
      <div className={cn('p-4 space-y-3', verdictConfig.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5', verdictConfig.color)} />
            <span className={cn('text-sm font-semibold', verdictConfig.color)}>
              {verdictConfig.label}
            </span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            {result.overallScore}%
          </span>
        </div>

        <Progress
          value={result.overallScore}
          className={cn('h-2.5', verdictConfig.progressColor)}
        />

        <p className="text-sm text-gray-600">
          {verdictConfig.description}
        </p>

        {result.cached && (
          <p className="text-xs text-gray-400 italic">
            Resultat en cache — analyse effectuee precedemment
          </p>
        )}
      </div>

      {/* Requirements list */}
      <div className="p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Connaissances et competences requises
        </h4>

        <div className="space-y-2.5">
          {sortedRequirements.map((req, index) => (
            <div
              key={index}
              className={cn(
                'rounded-lg border p-3 space-y-2',
                getStatusBgColor(req.status)
              )}
            >
              {/* Requirement title + status icon */}
              <div className="flex items-start gap-2.5">
                {getStatusIcon(req.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {req.requirement}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {req.explanation}
                  </p>
                </div>
              </div>

              {/* Suggestion box */}
              {req.suggestion && (
                <div className="flex items-start gap-2 ml-[30px] bg-white/70 rounded-md px-3 py-2 border border-gray-100">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {req.suggestion}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Analyse basee sur : <span className="font-medium text-gray-500">{cvFileName}</span>
        </p>
      </div>
    </div>
  );
}
