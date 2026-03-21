'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { unsaveJob } from '@/lib/db/kandid-queries';

export async function unsaveJobAction(jobId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Non authentifie');
  }

  await unsaveJob(userId, jobId);
  revalidatePath('/dashboard/saved-jobs');
}
