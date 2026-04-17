"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  MessageSquare,
  Building2,
  ListChecks,
  Globe,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  InterviewPrepData,
  InterviewPrepStory,
  InterviewPrepQuestion,
  CompanySignals,
  TechnicalChecklistItem,
  SwissContext,
} from "@/lib/ai/interview-prep";

const categoryConfig: Record<
  InterviewPrepQuestion["category"],
  { label: string; className: string }
> = {
  technical: { label: "Technique", className: "bg-muted text-foreground" },
  behavioral: {
    label: "Comportemental",
    className: "bg-muted text-foreground",
  },
  role_specific: {
    label: "Poste",
    className: "bg-muted text-foreground",
  },
  red_flag: {
    label: "Point sensible",
    className: "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400",
  },
};

const priorityConfig: Record<
  TechnicalChecklistItem["priority"],
  { label: string; className: string }
> = {
  high: { label: "Haute", className: "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400" },
  medium: { label: "Moyenne", className: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400" },
  low: { label: "Basse", className: "bg-muted text-muted-foreground" },
};

export default function InterviewPrepPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [interviewPrep, setInterviewPrep] =
    useState<InterviewPrepData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPrep() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}/interview-prep`);
      if (res.status === 404) {
        router.push("/dashboard/applications");
        return;
      }
      if (!res.ok) {
        throw new Error("Erreur lors du chargement");
      }
      const data = await res.json();
      setInterviewPrep(data.interviewPrep);
      setGeneratedAt(data.generatedAt);
    } catch {
      setError("Impossible de charger le dossier de préparation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}/interview-prep`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? "Erreur lors de la génération"
        );
      }
      const data = await res.json();
      setInterviewPrep(data.interviewPrep);
      setGeneratedAt(data.generatedAt);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la génération"
      );
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    fetchPrep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/applications">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Préparation entretien</h1>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPrep}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {!interviewPrep && !generating && !error && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Dossier de préparation
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Générez un dossier complet pour votre entretien : histoires STAR+R,
              questions probables, signaux culturels, checklist technique et
              contexte du marché suisse.
            </p>
            <Button onClick={handleGenerate}>
              Générer le dossier de préparation
            </Button>
          </CardContent>
        </Card>
      )}

      {generating && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Génération en cours...
            </h2>
            <p className="text-muted-foreground">
              Analyse de votre profil et du poste (15-30 secondes)
            </p>
          </CardContent>
        </Card>
      )}

      {interviewPrep && (
        <>
          {generatedAt && (
            <p className="text-sm text-muted-foreground">
              Généré le{" "}
              {new Date(generatedAt).toLocaleDateString("fr-CH", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          <StoriesSection stories={interviewPrep.stories} />
          <QuestionsSection questions={interviewPrep.likelyQuestions} />
          <SignalsSection signals={interviewPrep.companySignals} />
          <ChecklistSection items={interviewPrep.technicalChecklist} />
          <SwissContextSection context={interviewPrep.swissContext} />
        </>
      )}
    </div>
  );
}

function StoriesSection({ stories }: { stories: InterviewPrepStory[] }) {
  if (!stories?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          Histoires STAR+R
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          {stories.map((story, i) => (
            <AccordionItem key={i} value={`story-${i}`}>
              <AccordionTrigger className="text-sm">
                <span className="flex-1 text-left pr-4">
                  {story.requirement || `Histoire ${i + 1}`}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {story.likelyQuestion && (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <span className="font-medium">Question probable :</span>{" "}
                      {story.likelyQuestion}
                    </div>
                  )}
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Situation :
                      </span>{" "}
                      {story.situation}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Tâche :
                      </span>{" "}
                      {story.task}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Action :
                      </span>{" "}
                      {story.action}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Résultat :
                      </span>{" "}
                      {story.result}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Réflexion :
                      </span>{" "}
                      {story.reflection}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function QuestionsSection({
  questions,
}: {
  questions: InterviewPrepQuestion[];
}) {
  if (!questions?.length) return null;

  const grouped = questions.reduce(
    (acc, q) => {
      const cat = q.category ?? "technical";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(q);
      return acc;
    },
    {} as Record<string, InterviewPrepQuestion[]>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Questions probables
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([cat, qs]) => {
          const config =
            categoryConfig[cat as InterviewPrepQuestion["category"]] ??
            categoryConfig.technical;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className={cn("border-transparent", config.className)}
                >
                  {config.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({qs.length})
                </span>
              </div>
              <div className="space-y-3">
                {qs.map((q, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-3 space-y-1.5 text-sm"
                  >
                    <p className="font-medium">{q.question}</p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Pourquoi :</span> {q.why}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Angle suggéré :</span>{" "}
                      {q.suggestedAngle}
                    </p>
                    {q.mappedStory && (
                      <p className="text-muted-foreground italic">
                        Histoire liée : {q.mappedStory}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SignalsSection({ signals }: { signals: CompanySignals }) {
  if (!signals) return null;
  const hasContent =
    signals.values?.length ||
    signals.vocabularyToUse?.length ||
    signals.thingsToAvoid?.length ||
    signals.questionsToAsk?.length;
  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Signaux entreprise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {signals.values?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Valeurs</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {signals.values.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {signals.vocabularyToUse?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Vocabulaire à utiliser</h4>
            <div className="flex flex-wrap gap-2">
              {signals.vocabularyToUse.map((v, i) => (
                <Badge key={i} variant="secondary">
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {signals.thingsToAvoid?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">À éviter</h4>
            <ul className="space-y-1 text-sm">
              {signals.thingsToAvoid.map((v, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-red-700 dark:text-red-400"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
        )}

        {signals.questionsToAsk?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              Questions à poser au recruteur
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {signals.questionsToAsk.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChecklistSection({ items }: { items: TechnicalChecklistItem[] }) {
  if (!items?.length) return null;

  const sorted = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="h-5 w-5" />
          Checklist technique
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((item, i) => {
            const config =
              priorityConfig[item.priority] ?? priorityConfig.low;
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "border-transparent shrink-0 mt-0.5",
                    config.className
                  )}
                >
                  {config.label}
                </Badge>
                <div className="text-sm">
                  <p className="font-medium">{item.topic}</p>
                  <p className="text-muted-foreground">{item.why}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SwissContextSection({ context }: { context: SwissContext }) {
  if (!context) return null;
  const hasContent =
    context.salaryNegotiation ||
    context.culturalNotes?.length ||
    context.marketPosition;
  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5" />
          Contexte suisse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {context.salaryNegotiation && (
          <div>
            <h4 className="text-sm font-medium mb-2">Négociation salariale</h4>
            <p className="text-sm text-muted-foreground">
              {context.salaryNegotiation}
            </p>
          </div>
        )}

        {context.culturalNotes?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Notes culturelles</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {context.culturalNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {context.marketPosition && (
          <div>
            <h4 className="text-sm font-medium mb-2">Position sur le marché</h4>
            <p className="text-sm text-muted-foreground">
              {context.marketPosition}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
