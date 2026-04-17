'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Sparkles,
  Info,
  ArrowUpDown,
  Briefcase,
  FileText,
  DollarSign,
  Pencil,
  MessageSquare,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type {
  StructuredMatchResult,
  BlockA,
  BlockB,
  BlockC,
  BlockD,
  BlockE,
  BlockF,
} from '@/lib/ai/match-job';

// =============================================================================
// Types
// =============================================================================

interface Requirement {
  requirement: string;
  status: 'met' | 'partial' | 'not_met';
  explanation: string;
  suggestion?: string;
}

interface MatchResultV1 {
  id: string | null;
  overallScore: number;
  verdict: 'excellent' | 'partial' | 'low';
  requirements: Requirement[];
  cached: boolean;
  matchVersion?: undefined;
}

interface MatchResultV2 {
  id: string | null;
  overallScore: number;
  verdict: 'excellent' | 'partial' | 'low';
  blocks: StructuredMatchResult['blocks'];
  cached: boolean;
  matchVersion: 2;
}

type MatchResult = MatchResultV1 | MatchResultV2;

interface MatchBreakdownProps {
  jobId: string;
  cvAnalysisId: string;
  cvFileName: string;
  onScoreLoaded?: (score: number) => void;
}

// =============================================================================
// Helpers
// =============================================================================

function getVerdictConfig(verdict: string, score: number) {
  if (verdict === 'excellent' || score >= 75) {
    return {
      label: 'Correspondance excellente',
      description: 'Votre profil est bien adapte a ce poste.',
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      progressColor: '[&>div[data-slot=progress-indicator]]:bg-emerald-500',
    };
  }
  if (verdict === 'partial' || score >= 40) {
    return {
      label: 'Bon potentiel',
      description: 'Votre profil a du potentiel pour ce poste, avec quelques ajustements.',
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      progressColor: '[&>div[data-slot=progress-indicator]]:bg-amber-500',
    };
  }
  return {
    label: 'A ameliorer',
    description: 'Votre profil necessite des ameliorations pour ce poste.',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
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
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'partial':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'not_met':
      return 'bg-red-500/10 border-red-500/20';
    default:
      return 'bg-muted border-border';
  }
}

function NullBlockFallback() {
  return (
    <div className="flex items-center gap-2 py-3 px-4 bg-muted rounded-lg border">
      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
      <p className="text-sm text-muted-foreground italic">
        Analyse incomplete pour cette section
      </p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const config = {
    high: 'bg-red-500/10 text-red-700 dark:text-red-400 border-transparent',
    medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-transparent',
    low: 'bg-muted text-muted-foreground border-transparent',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', config[priority])}>
      {priority === 'high' ? 'Haute' : priority === 'medium' ? 'Moyenne' : 'Basse'}
    </span>
  );
}

// =============================================================================
// Block Renderers
// =============================================================================

function BlockARender({ data }: { data: BlockA }) {
  const fields = [
    { label: 'Archetype', value: data.archetype },
    { label: 'Domaine', value: data.domain },
    { label: 'Fonction', value: data.function },
    { label: 'Seniorite', value: data.seniority },
    { label: 'Remote', value: data.remotePolicy },
    { label: 'Taille equipe', value: data.teamSize },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <div key={f.label} className="bg-muted rounded-lg px-3 py-2 border border-border">
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <p className="text-sm font-medium text-foreground">{f.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-muted border rounded-lg px-4 py-3">
        <p className="text-sm font-medium text-foreground">TL;DR</p>
        <p className="text-sm text-muted-foreground mt-1">{data.tldr}</p>
      </div>
    </div>
  );
}

function BlockBRender({ data }: { data: BlockB }) {
  const sorted = [...data.requirements].sort((a, b) => {
    const order = { met: 0, partial: 1, not_met: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });
  return (
    <div className="space-y-2.5">
      {sorted.map((req, i) => (
        <div
          key={i}
          className={cn('rounded-lg border p-3 space-y-2', getStatusBgColor(req.status))}
        >
          <div className="flex items-start gap-2.5">
            {getStatusIcon(req.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{req.requirement}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{req.explanation}</p>
            </div>
          </div>
          {req.gapAnalysis && (
            <div className="ml-[30px] bg-background/70 rounded-lg px-3 py-2 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Analyse des ecarts</p>
              <p className="text-sm text-foreground leading-relaxed">{req.gapAnalysis}</p>
            </div>
          )}
          {req.mitigationStrategy && (
            <div className="flex items-start gap-2 ml-[30px] bg-background/70 rounded-lg px-3 py-2 border">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Strategie</p>
                <p className="text-sm text-foreground leading-relaxed">{req.mitigationStrategy}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BlockCRender({ data }: { data: BlockC }) {
  const alignmentConfig = {
    match: { label: 'Alignement', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-transparent' },
    above: { label: 'Au-dessus', color: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-transparent' },
    below: { label: 'En-dessous', color: 'text-red-700 dark:text-red-400 bg-red-500/10 border-transparent' },
  };
  const align = alignmentConfig[data.alignment] ?? alignmentConfig.match;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg px-3 py-2 border border-border">
          <p className="text-xs text-gray-500">Niveau demande</p>
          <p className="text-sm font-medium text-gray-900">{data.detectedLevel}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2 border border-border">
          <p className="text-xs text-gray-500">Votre niveau</p>
          <p className="text-sm font-medium text-gray-900">{data.candidateLevel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', align.color)}>
          {align.label}
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{data.strategy}</p>
    </div>
  );
}

function BlockDRender({ data }: { data: BlockD }) {
  return (
    <div className="space-y-3">
      <div className="bg-muted rounded-lg px-4 py-3 border">
        <p className="text-xs text-muted-foreground mb-1">Fourchette salariale ({data.salaryRange.canton})</p>
        <p className="text-lg font-semibold text-foreground">
          {data.salaryRange.currency} {data.salaryRange.min.toLocaleString('fr-CH')} – {data.salaryRange.max.toLocaleString('fr-CH')}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm">
        {data.thirteenthMonth && (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0">13e mois:</span>
            <span className="text-foreground">{data.thirteenthMonth}</span>
          </div>
        )}
        {data.lppNote && (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0">LPP:</span>
            <span className="text-foreground">{data.lppNote}</span>
          </div>
        )}
        {data.cctReference && (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0">CCT:</span>
            <span className="text-foreground">{data.cctReference}</span>
          </div>
        )}
        {data.marketContext && (
          <p className="text-muted-foreground leading-relaxed">{data.marketContext}</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground italic border-t pt-2">
        Base sur les donnees disponibles — a titre indicatif uniquement
      </p>
    </div>
  );
}

function BlockERender({ data }: { data: BlockE }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Cible</th>
            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Section</th>
            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Etat actuel</th>
            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Recommandation</th>
            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Priorite</th>
          </tr>
        </thead>
        <tbody>
          {data.changes.map((change, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 px-2 text-muted-foreground capitalize">{change.target}</td>
              <td className="py-2 px-2 text-foreground font-medium">{change.section}</td>
              <td className="py-2 px-2 text-muted-foreground">{change.currentState}</td>
              <td className="py-2 px-2 text-foreground">{change.recommendedChange}</td>
              <td className="py-2 px-2">
                <PriorityBadge priority={change.priority} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockFRender({ data }: { data: BlockF }) {
  return (
    <div className="space-y-3">
      {data.stories.map((story, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{story.requirement}</p>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm">
            <div>
              <span className="font-medium text-indigo-600">S — </span>
              <span className="text-foreground">{story.situation}</span>
            </div>
            <div>
              <span className="font-medium text-indigo-600">T — </span>
              <span className="text-foreground">{story.task}</span>
            </div>
            <div>
              <span className="font-medium text-indigo-600">A — </span>
              <span className="text-foreground">{story.action}</span>
            </div>
            <div>
              <span className="font-medium text-indigo-600">R — </span>
              <span className="text-foreground">{story.result}</span>
            </div>
            <div>
              <span className="font-medium text-indigo-600">R — </span>
              <span className="text-foreground">{story.reflection}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// V1 Requirements Renderer (backward compat)
// =============================================================================

function V1RequirementsList({ requirements }: { requirements: Requirement[] }) {
  const sorted = [...requirements].sort((a, b) => {
    const order = { met: 0, partial: 1, not_met: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div className="p-4 space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Connaissances et competences requises
      </h4>
      <div className="space-y-2.5">
        {sorted.map((req, index) => (
          <div
            key={index}
            className={cn('rounded-lg border p-3 space-y-2', getStatusBgColor(req.status))}
          >
            <div className="flex items-start gap-2.5">
              {getStatusIcon(req.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{req.requirement}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{req.explanation}</p>
              </div>
            </div>
            {req.suggestion && (
              <div className="flex items-start gap-2 ml-[30px] bg-background/70 rounded-lg px-3 py-2 border">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{req.suggestion}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// V2 Accordion Renderer
// =============================================================================

function getBlockBSummary(data: BlockB | null): string {
  if (!data) return '';
  const met = data.requirements.filter((r) => r.status === 'met').length;
  const partial = data.requirements.filter((r) => r.status === 'partial').length;
  const notMet = data.requirements.filter((r) => r.status === 'not_met').length;
  return `${met} OK · ${partial} partiel · ${notMet} manquant`;
}

const BLOCK_CONFIG = [
  { key: 'a' as const, label: 'Synthese du poste', icon: Briefcase },
  { key: 'b' as const, label: 'Matching CV', icon: FileText },
  { key: 'c' as const, label: 'Niveau & Strategie', icon: ArrowUpDown },
  { key: 'd' as const, label: 'Recherche salariale', icon: DollarSign },
  { key: 'e' as const, label: 'Plan de personnalisation', icon: Pencil },
  { key: 'f' as const, label: 'Preparation entretien', icon: MessageSquare },
] as const;

function V2AccordionView({ blocks }: { blocks: StructuredMatchResult['blocks'] }) {
  return (
    <div className="p-4">
      <Accordion type="single" collapsible defaultValue="block-b">
        {BLOCK_CONFIG.map(({ key, label, icon: Icon }) => {
          const blockData = blocks[key];
          const summary = key === 'b' ? getBlockBSummary(blocks.b) : null;
          return (
            <AccordionItem key={key} value={`block-${key}`}>
              <AccordionTrigger className="px-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
                  {summary && (
                    <span className="text-xs text-muted-foreground font-normal ml-2">{summary}</span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1">
                {blockData === null ? (
                  <NullBlockFallback />
                ) : key === 'a' ? (
                  <BlockARender data={blockData as BlockA} />
                ) : key === 'b' ? (
                  <BlockBRender data={blockData as BlockB} />
                ) : key === 'c' ? (
                  <BlockCRender data={blockData as BlockC} />
                ) : key === 'd' ? (
                  <BlockDRender data={blockData as BlockD} />
                ) : key === 'e' ? (
                  <BlockERender data={blockData as BlockE} />
                ) : (
                  <BlockFRender data={blockData as BlockF} />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MatchBreakdown({ jobId, cvAnalysisId, cvFileName, onScoreLoaded }: MatchBreakdownProps) {
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
      onScoreLoaded?.(data.overallScore);
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

  useEffect(() => {
    fetchMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-muted p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 text-foreground animate-spin" />
            <Sparkles className="h-4 w-4 text-muted-foreground absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Analyse en cours...</p>
            <p className="text-xs text-muted-foreground mt-1">
              L'IA compare votre profil avec les exigences du poste
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-700 dark:text-red-400 hover:text-red-800 mt-2 p-0 h-auto font-medium"
          onClick={fetchMatch}
        >
          Reessayer l'analyse
        </Button>
      </div>
    );
  }

  if (!result) return null;

  const verdictConfig = getVerdictConfig(result.verdict, result.overallScore);
  const isV2 = result.matchVersion === 2;

  return (
    <div className={cn('rounded-lg border overflow-hidden', verdictConfig.borderColor)}>
      {/* Header — Score summary (works for both v1 and v2) */}
      <div className={cn('p-4 space-y-3', verdictConfig.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5', verdictConfig.color)} />
            <span className={cn('text-sm font-semibold', verdictConfig.color)}>
              {verdictConfig.label}
            </span>
          </div>
          <span className="text-lg font-bold text-foreground">{result.overallScore}%</span>
        </div>
        <Progress
          value={result.overallScore}
          className={cn('h-2.5', verdictConfig.progressColor)}
        />
        <p className="text-sm text-muted-foreground">{verdictConfig.description}</p>
        {result.cached && (
          <p className="text-xs text-muted-foreground italic">
            Resultat en cache — analyse effectuee precedemment
          </p>
        )}
      </div>

      {/* Content: v2 accordion or v1 flat list */}
      {isV2 && 'blocks' in result ? (
        <V2AccordionView blocks={result.blocks} />
      ) : (
        'requirements' in result && <V1RequirementsList requirements={result.requirements} />
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-muted border-t">
        <p className="text-xs text-muted-foreground">
          Analyse basee sur : <span className="font-medium text-foreground">{cvFileName}</span>
        </p>
      </div>
    </div>
  );
}
