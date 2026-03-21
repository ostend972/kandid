'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, FileText, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setActiveCvAction } from '@/app/(dashboard)/dashboard/actions';

interface CvAnalysis {
  id: string;
  fileName: string;
  overallScore: number;
  createdAt: Date | null;
}

interface ActiveCvSelectorProps {
  analyses: CvAnalysis[];
  activeCvId: string | null;
}

export function ActiveCvSelector({
  analyses,
  activeCvId,
}: ActiveCvSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(analysisId: string) {
    startTransition(async () => {
      await setActiveCvAction(analysisId);
      setOpen(false);
    });
  }

  if (analyses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
        <FileText className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-3 text-sm text-gray-600">
          Vous n'avez pas encore analyse de CV
        </p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Changer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisir le CV actif</DialogTitle>
          <DialogDescription>
            Selectionnez le CV a utiliser pour le matching avec les offres.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {analyses.map((analysis) => {
            const isActive = analysis.id === activeCvId;
            const date = analysis.createdAt
              ? new Date(analysis.createdAt).toLocaleDateString('fr-CH')
              : '—';

            return (
              <button
                key={analysis.id}
                disabled={isPending}
                onClick={() => handleSelect(analysis.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors',
                  isActive
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {analysis.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Analyse le {date} — Score : {analysis.overallScore}/100
                    </p>
                  </div>
                </div>
                {isActive && (
                  <Check className="h-5 w-5 text-indigo-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
