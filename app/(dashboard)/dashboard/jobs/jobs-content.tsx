'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR, { mutate as globalMutate } from 'swr';
import {
  ChevronLeft,
  ChevronRight,
  SearchX,
} from 'lucide-react';
import { JobFilters } from '@/components/jobs/job-filters';
import { JobCard, JobCardSkeleton, type JobCardData } from '@/components/jobs/job-card';
import { JobDetail, type JobDetailData } from '@/components/jobs/job-detail';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface JobsApiResponse {
  jobs: JobCardData[];
  total: number;
  page: number;
  totalPages: number;
  alignedCount?: number;
  hasProfile?: boolean;
}

interface JobDetailApiResponse {
  job: JobDetailData;
  hasCvAnalysis: boolean;
  cvAnalysisId: string | null;
  cvFileName: string | null;
}

interface SavedIdsResponse {
  ids: string[];
}

interface AppliedIdsResponse {
  ids: string[];
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Component ───────────────────────────────────────────────────────────────

export function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const apiUrl = `/api/jobs?${searchParams.toString()}`;

  const { data: jobsData, isLoading: jobsLoading } = useSWR<JobsApiResponse>(
    apiUrl,
    fetcher,
    { keepPreviousData: true }
  );

  const { data: savedIdsData } = useSWR<SavedIdsResponse>(
    '/api/jobs/saved-ids',
    fetcher
  );

  const { data: appliedIdsData } = useSWR<AppliedIdsResponse>(
    '/api/jobs/applied-ids',
    fetcher
  );

  const { data: detailData } = useSWR<JobDetailApiResponse>(
    selectedJobId ? `/api/jobs/${selectedJobId}` : null,
    fetcher
  );

  const savedJobIds = new Set(savedIdsData?.ids ?? []);
  const appliedJobIds = new Set(appliedIdsData?.ids ?? []);
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const totalPages = jobsData?.totalPages ?? 1;
  const total = jobsData?.total ?? 0;
  const alignedCount = jobsData?.alignedCount ?? 0;

  // ─── Handlers ──────────────────────────────────────────────────────────

  function handleSelectJob(jobId: string) {
    setSelectedJobId(jobId);
  }

  function handleSelectJobMobile(jobId: string) {
    router.push(`/dashboard/jobs/${jobId}`);
  }

  const handleToggleSave = useCallback(
    async (jobId: string) => {
      const isSaved = savedJobIds.has(jobId);

      const newIds = isSaved
        ? [...savedJobIds].filter((id) => id !== jobId)
        : [...savedJobIds, jobId];

      globalMutate('/api/jobs/saved-ids', { ids: newIds }, false);

      try {
        await fetch('/api/jobs/save', {
          method: isSaved ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        globalMutate('/api/jobs/saved-ids');
      } catch {
        globalMutate('/api/jobs/saved-ids');
      }
    },
    [savedJobIds]
  );

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.push(`/dashboard/jobs?${params.toString()}`, { scroll: false });
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <JobFilters />

      {/* Meta line — total + aligned */}
      {!jobsLoading && total > 0 && (
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {total.toLocaleString('fr-CH')}{' '}
            {total === 1 ? 'offre' : 'offres'}
            {alignedCount > 0 && (
              <>
                {' · '}
                <span className="text-foreground">
                  {alignedCount.toLocaleString('fr-CH')} alignées
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Split view */}
      <div className="grid gap-6 lg:grid-cols-[minmax(340px,480px)_1fr]">
        {/* Left — list */}
        <div className="flex min-w-0 flex-col">
          <div className="space-y-3">
            {jobsLoading ? (
              Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)
            ) : jobsData && jobsData.jobs.length > 0 ? (
              jobsData.jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isActive={selectedJobId === job.id}
                  isSaved={savedJobIds.has(job.id)}
                  isApplied={appliedJobIds.has(job.id)}
                  onSelect={() => {
                    if (window.matchMedia('(min-width: 1024px)').matches) {
                      handleSelectJob(job.id);
                    } else {
                      handleSelectJobMobile(job.id);
                    }
                  }}
                  onToggleSave={() => handleToggleSave(job.id)}
                />
              ))
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                className={cn(
                  'inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium transition-colors',
                  currentPage <= 1
                    ? 'opacity-40 cursor-not-allowed'
                    : 'text-foreground hover:border-foreground'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className={cn(
                  'inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium transition-colors',
                  currentPage >= totalPages
                    ? 'opacity-40 cursor-not-allowed'
                    : 'text-foreground hover:border-foreground'
                )}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right — detail (desktop only) */}
        <div className="hidden min-w-0 lg:block">
          <div className="sticky top-6">
            <div className="rounded-3xl border border-border bg-background p-6 sm:p-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <JobDetail
                job={detailData?.job ?? null}
                isSaved={selectedJobId ? savedJobIds.has(selectedJobId) : false}
                onToggleSave={() => {
                  if (selectedJobId) handleToggleSave(selectedJobId);
                }}
                hasCvAnalysis={detailData?.hasCvAnalysis ?? false}
                cvAnalysisId={detailData?.cvAnalysisId ?? null}
                cvFileName={detailData?.cvFileName ?? null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-background p-10 text-center">
      <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full border border-border">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Aucun résultat
      </p>
      <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground">
        Aucune offre ne correspond à vos filtres
      </h3>
      <p className="mt-3 max-w-xs mx-auto text-sm text-muted-foreground leading-relaxed">
        Élargissez votre recherche ou modifiez vos critères pour voir davantage d&apos;opportunités.
      </p>
    </div>
  );
}
