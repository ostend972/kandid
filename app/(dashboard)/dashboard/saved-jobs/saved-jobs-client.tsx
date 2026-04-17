'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplyWizard } from '@/components/application/apply-wizard';

// ---------------------------------------------------------------------------
// Sort toggle
// ---------------------------------------------------------------------------

interface SortToggleProps {
  currentSort: 'date' | 'score';
}

export function SortToggle({ currentSort }: SortToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setSort(sort: 'date' | 'score') {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === 'date') {
      params.delete('sort');
    } else {
      params.set('sort', sort);
    }
    router.push(`/dashboard/saved-jobs?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">Trier par :</span>
      <button
        onClick={() => setSort('date')}
        className={`rounded-full px-2.5 py-1 text-sm font-medium transition-colors ${
          currentSort === 'date'
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        Date
      </button>
      <button
        onClick={() => setSort('score')}
        className={`rounded-full px-2.5 py-1 text-sm font-medium transition-colors ${
          currentSort === 'score'
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        Pertinence
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Postuler button (wraps ApplyWizard)
// ---------------------------------------------------------------------------

interface PostulerButtonProps {
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobSourceUrl: string;
  cvAnalysisId: string;
}

export function PostulerButton({
  jobId,
  jobTitle,
  jobCompany,
  jobSourceUrl,
  cvAnalysisId,
}: PostulerButtonProps) {
  return (
    <ApplyWizard
      jobId={jobId}
      jobTitle={jobTitle}
      jobCompany={jobCompany}
      jobSourceUrl={jobSourceUrl}
      cvAnalysisId={cvAnalysisId}
      trigger={
        <Button size="sm" className="gap-1.5">
          <Send className="h-3.5 w-3.5" />
          Postuler
        </Button>
      }
    />
  );
}
