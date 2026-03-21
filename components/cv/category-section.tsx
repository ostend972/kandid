"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { TipCard } from "./tip-card";
import { cn } from "@/lib/utils";

export interface CategoryTip {
  type: "good" | "improve" | "critical";
  title: string;
  explanation: string;
  suggestion?: string;
}

export interface CategoryData {
  score: number;
  tips: CategoryTip[];
}

type CategoryKey =
  | "ats"
  | "swissAdaptation"
  | "content"
  | "structure"
  | "skills";

const categoryLabels: Record<CategoryKey, string> = {
  ats: "Lisibilite et organisation",
  swissAdaptation: "Adaptation au marche suisse",
  content: "Qualite du contenu",
  structure: "Structure et format",
  skills: "Presentation des competences",
};

function getBarColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

interface CategorySectionProps {
  categoryKey: CategoryKey;
  data: CategoryData;
}

export function CategorySection({ categoryKey, data }: CategorySectionProps) {
  const label = categoryLabels[categoryKey];

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={categoryKey} className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex flex-1 items-center gap-4 pr-2">
            <span className="text-sm font-semibold text-gray-900 shrink-0">
              {label}
            </span>
            <div className="flex-1 min-w-0">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-700",
                    getBarColor(data.score)
                  )}
                  style={{ width: `${Math.max(data.score, 2)}%` }}
                />
              </div>
            </div>
            <span
              className={cn(
                "text-sm font-bold tabular-nums shrink-0",
                getScoreTextColor(data.score)
              )}
            >
              {data.score}/100
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2">
            {data.tips.map((tip, idx) => (
              <TipCard
                key={idx}
                type={tip.type}
                title={tip.title}
                explanation={tip.explanation}
                suggestion={tip.suggestion}
              />
            ))}
            {data.tips.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                Aucun conseil pour cette categorie.
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface AllCategoriesProps {
  categories: Record<CategoryKey, CategoryData>;
}

export function AllCategories({ categories }: AllCategoriesProps) {
  const keys: CategoryKey[] = [
    "ats",
    "swissAdaptation",
    "content",
    "structure",
    "skills",
  ];

  return (
    <div className="space-y-3">
      {keys.map((key) => (
        <CategorySection key={key} categoryKey={key} data={categories[key]} />
      ))}
    </div>
  );
}
