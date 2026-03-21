'use client';

import { Suspense } from 'react';
import { JobsPageContent } from './jobs-content';

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <JobsPageContent />
    </Suspense>
  );
}
