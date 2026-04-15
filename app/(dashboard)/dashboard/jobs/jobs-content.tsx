'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useSWR, { mutate as globalMutate } from 'swr';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Briefcase,
  SearchX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JobFilters } from '@/components/jobs/job-filters';
import { JobCard, JobCardSkeleton, type JobCardData } from '@/components/jobs/job-card';
import { JobDetail, type JobDetailData } from '@/components/jobs/job-detail';

// ─── Types ───────────────────────────────────────────────────────────────────

interface JobsApiResponse {
  jobs: JobCardData[];
  total: number;
  page: number;
  totalPages: number;
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

  // Build API URL from search params
  const apiUrl = `/api/jobs?${searchParams.toString()}`;

  // Fetch jobs list
  const {
    data: jobsData,
    isLoading: jobsLoading,
  } = useSWR<JobsApiResponse>(apiUrl, fetcher, {
    keepPreviousData: true,
  });

  // Fetch saved job IDs
  const { data: savedIdsData } = useSWR<SavedIdsResponse>(
    '/api/jobs/saved-ids',
    fetcher
  );

  // Fetch applied job IDs
  const { data: appliedIdsData } = useSWR<AppliedIdsResponse>(
    '/api/jobs/applied-ids',
    fetcher
  );

  // Fetch selected job detail
  const { data: detailData } = useSWR<JobDetailApiResponse>(
    selectedJobId ? `/api/jobs/${selectedJobId}` : null,
    fetcher
  );

  const savedJobIds = new Set(savedIdsData?.ids ?? []);
  const appliedJobIds = new Set(appliedIdsData?.ids ?? []);
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const totalPages = jobsData?.totalPages ?? 1;
  const total = jobsData?.total ?? 0;

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

      // Optimistic update
      const newIds = isSaved
        ? [...savedJobIds].filter((id) => id !== jobId)
        : [...savedJobIds, jobId];

      globalMutate(
        '/api/jobs/saved-ids',
        { ids: newIds },
        false
      );

      try {
        await fetch('/api/jobs/save', {
          method: isSaved ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        // Revalidate
        globalMutate('/api/jobs/saved-ids');
      } catch {
        // Revert on error
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
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Offres d'emploi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total > 0
            ? `${total.toLocaleString('fr-CH')} offres en Suisse romande`
            : 'Parcourez les offres d\'emploi en Suisse romande.'}
        </p>
      </div>

      {/* No CV banner */}
      {detailData && !detailData.hasCvAnalysis && (
        <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
          <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
          <p className="text-sm text-indigo-800 flex-1">
            Analysez votre CV pour voir votre compatibilite avec chaque offre
          </p>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/dashboard/cv-analysis">Analyser mon CV</Link>
          </Button>
        </div>
      )}

      {/* Filter bar */}
      <JobFilters />

      {/* Split view: desktop = side-by-side, mobile = list only */}
      <div className="flex gap-4 min-h-[calc(100vh-20rem)]">
        {/* Left panel — Job list */}
        <div className="w-full lg:w-[40%] lg:min-w-[340px] lg:max-w-[480px] flex flex-col">
          <ScrollArea className="flex-1 -mx-1 px-1">
            <div className="space-y-2 pb-4">
              {jobsLoading ? (
                // Skeleton loading state
                Array.from({ length: 8 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))
              ) : jobsData && jobsData.jobs.length > 0 ? (
                // Job cards
                jobsData.jobs.map((job) => (
                  <div key={job.id}>
                    {/* Desktop: select in split view */}
                    <div className="hidden lg:block">
                      <JobCard
                        job={job}
                        isActive={selectedJobId === job.id}
                        isSaved={savedJobIds.has(job.id)}
                        isApplied={appliedJobIds.has(job.id)}
                        onSelect={() => handleSelectJob(job.id)}
                        onToggleSave={() => handleToggleSave(job.id)}
                      />
                    </div>
                    {/* Mobile: navigate to detail page */}
                    <div className="lg:hidden">
                      <JobCard
                        job={job}
                        isActive={false}
                        isSaved={savedJobIds.has(job.id)}
                        isApplied={appliedJobIds.has(job.id)}
                        onSelect={() => handleSelectJobMobile(job.id)}
                        onToggleSave={() => handleToggleSave(job.id)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                // Empty state
                <div className="flex flex-col items-center py-16 text-center">
                  <SearchX className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-base font-semibold text-gray-600">
                    Aucune offre ne correspond a vos filtres
                  </h3>
                  <p className="text-sm text-gray-400 mt-2 max-w-xs">
                    Essayez d'elargir votre recherche ou de modifier vos
                    criteres de filtrage.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Precedent
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Right panel — Job detail (desktop only) */}
        <div className="hidden lg:block flex-1 min-w-0">
          <div className="sticky top-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="rounded-lg border bg-card p-6">
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
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
