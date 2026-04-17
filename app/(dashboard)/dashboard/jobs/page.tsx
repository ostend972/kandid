import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ensureCurrentUser } from '@/lib/auth/ensure-user';
import { JobsHeroSlot } from '@/components/jobs/jobs-hero';
import { JobsPageContent } from './jobs-content';

export const dynamic = 'force-dynamic';

function HeroSkeleton() {
  return (
    <section className="rounded-3xl bg-foreground p-8 sm:p-12">
      <div className="h-3 w-48 animate-pulse rounded bg-background/20" />
      <div className="mt-5 h-12 w-3/4 animate-pulse rounded bg-background/20" />
      <div className="mt-5 h-4 w-full max-w-xl animate-pulse rounded bg-background/10" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-background/10" />
    </section>
  );
}

export default async function JobsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  await ensureCurrentUser(userId);

  return (
    <div className="space-y-8">
      <Suspense fallback={<HeroSkeleton />}>
        <JobsHeroSlot userId={userId} />
      </Suspense>

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-foreground border-t-transparent rounded-full" />
          </div>
        }
      >
        <JobsPageContent />
      </Suspense>
    </div>
  );
}
