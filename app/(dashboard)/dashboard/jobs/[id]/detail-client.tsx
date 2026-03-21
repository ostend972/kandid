'use client';

import { useCallback, useState } from 'react';
import { JobDetail, type JobDetailData } from '@/components/jobs/job-detail';

interface JobDetailMobileClientProps {
  job: JobDetailData;
  initialIsSaved: boolean;
  hasCvAnalysis: boolean;
  cvAnalysisId?: string | null;
  cvFileName?: string | null;
}

export function JobDetailMobileClient({
  job,
  initialIsSaved,
  hasCvAnalysis,
  cvAnalysisId = null,
  cvFileName = null,
}: JobDetailMobileClientProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);

  const handleToggleSave = useCallback(async () => {
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      await fetch('/api/jobs/save', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
    } catch {
      // Revert on error
      setIsSaved(wasSaved);
    }
  }, [isSaved, job.id]);

  return (
    <JobDetail
      job={job}
      isSaved={isSaved}
      onToggleSave={handleToggleSave}
      hasCvAnalysis={hasCvAnalysis}
      cvAnalysisId={cvAnalysisId}
      cvFileName={cvFileName}
    />
  );
}
